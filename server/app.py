"""Small private feedback inbox. Author: Lliftime."""
import base64
import binascii
from collections import defaultdict, deque
from contextlib import contextmanager
from functools import wraps
import hashlib
import hmac
import io
import os
from pathlib import Path
import re
import sqlite3
import threading
import time
import uuid
import warnings

from flask import Flask, Response, jsonify, render_template, request
from PIL import Image, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 20_000_000


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(
        MAX_CONTENT_LENGTH=7 * 1024 * 1024,
        DATABASE=os.environ.get('FEEDBACK_DATABASE', '/var/lib/learn-feedback/feedback.sqlite3'),
        ADMIN_PASSWORD_HASH=os.environ.get('FEEDBACK_ADMIN_PASSWORD_HASH', ''),
        ALLOWED_ORIGIN=os.environ.get('FEEDBACK_ORIGIN', 'https://learn.liftime.xyz'),
    )
    if config:
        app.config.update(config)
    if not re.fullmatch(r'[a-f0-9]{64}', app.config['ADMIN_PASSWORD_HASH']):
        raise RuntimeError('FEEDBACK_ADMIN_PASSWORD_HASH must be configured')
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connect():
        db = sqlite3.connect(app.config['DATABASE'], timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY, created INTEGER NOT NULL, message TEXT NOT NULL,
            email TEXT NOT NULL, page TEXT NOT NULL, image BLOB, status TEXT NOT NULL DEFAULT 'new')''')

    buckets = defaultdict(deque)
    lock = threading.Lock()

    def limited(scope, count, seconds):
        # ProxyFix is deliberately not enabled: Nginx overwrites X-Real-IP.
        key = (scope, request.headers.get('X-Real-IP', request.remote_addr))
        now = time.monotonic()
        with lock:
            if len(buckets) > 10000:
                for old in list(buckets):
                    if not buckets[old] or now - buckets[old][-1] > 3600:
                        del buckets[old]
            bucket = buckets[key]
            while bucket and now - bucket[0] >= seconds:
                bucket.popleft()
            if len(bucket) >= count:
                return True
            bucket.append(now)
        return False

    def private(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            auth = request.authorization
            password = auth.password if auth and auth.type.lower() == 'basic' else ''
            valid = (auth and auth.username == 'admin' and isinstance(password, str)
                     and hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(),
                                             app.config['ADMIN_PASSWORD_HASH']))
            if not valid:
                if limited('login', 10, 300):
                    return jsonify(error='尝试次数过多，请 5 分钟后重试。'), 429
                return Response('需要管理员登录', 401,
                                {'WWW-Authenticate': 'Basic realm="Learning feedback", charset="UTF-8"'})
            return func(*args, **kwargs)
        return wrapped

    @app.after_request
    def headers(response):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'same-origin'
        response.headers['Content-Security-Policy'] = (
            "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; "
            "form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
        return response

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify(error='截图或内容过大，请缩小后再提交。'), 413

    @app.post('/api/feedback')
    def submit():
        if request.headers.get('Origin') != app.config['ALLOWED_ORIGIN']:
            return jsonify(error='提交来源无效，请从学习网站发送。'), 403
        if limited('submit', 5, 600):
            return jsonify(error='提交太频繁，请 10 分钟后再试。'), 429
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify(error='反馈格式无效。'), 400
        message, email, page = (data.get(k, '') for k in ('message', 'email', 'page'))
        if not isinstance(message, str) or not 1 <= len(message.strip()) <= 2000:
            return jsonify(error='请填写 1–2000 字的反馈内容。'), 400
        if (not isinstance(email, str) or len(email) > 254
                or (email and not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', email))):
            return jsonify(error='邮箱格式不正确。'), 400
        if not isinstance(page, str) or len(page) > 500 or not page.startswith('/'):
            return jsonify(error='页面位置无效。'), 400
        image = None
        if data.get('image'):
            value = data['image']
            if not isinstance(value, str) or not re.match(r'^data:image/(png|jpeg|webp);base64,', value):
                return jsonify(error='仅支持 PNG、JPEG 或 WebP 截图。'), 400
            try:
                raw = base64.b64decode(value.split(',', 1)[1], validate=True)
                if len(raw) > 5 * 1024 * 1024:
                    return jsonify(error='截图不能超过 5 MB。'), 400
                with warnings.catch_warnings():
                    warnings.simplefilter('error', Image.DecompressionBombWarning)
                    with Image.open(io.BytesIO(raw)) as picture:
                        if picture.format not in ('PNG', 'JPEG', 'WEBP'):
                            raise ValueError('image format')
                        picture.load()
                        picture.thumbnail((2400, 2400))
                        # Decode and re-encode: strip metadata and embedded payloads.
                        clean = Image.new('RGB', picture.size, 'white')
                        if 'A' in picture.getbands():
                            clean.paste(picture, mask=picture.getchannel('A'))
                        else:
                            clean.paste(picture.convert('RGB'))
                        output = io.BytesIO()
                        clean.save(output, 'JPEG', quality=90)
                        image = output.getvalue()
            except (ValueError, binascii.Error, UnidentifiedImageError, OSError,
                    Image.DecompressionBombWarning, Image.DecompressionBombError):
                return jsonify(error='图片无法读取或尺寸过大，请换一张截图。'), 400
        identifier = uuid.uuid4().hex[:16]
        with connect() as db:
            db.execute('INSERT INTO feedback (id,created,message,email,page,image) VALUES (?,?,?,?,?,?)',
                       (identifier, int(time.time()), message.strip(), email.strip(), page, image))
        return jsonify(id=identifier), 201

    @app.get('/feedback-admin')
    @app.get('/feedback-admin/')
    @private
    def inbox():
        try:
            page = max(1, int(request.args.get('page', '1')))
        except ValueError:
            page = 1
        with connect() as db:
            total = db.execute('SELECT COUNT(*) FROM feedback').fetchone()[0]
            rows = db.execute('''SELECT id,datetime(created,'unixepoch','+8 hours') AS created_at,message,email,page,status,image IS NOT NULL AS has_image
                                 FROM feedback ORDER BY created DESC, rowid DESC LIMIT 20 OFFSET ?''',
                              ((page - 1) * 20,)).fetchall()
        return render_template('inbox.html', rows=rows, page=page, total=total)

    @app.get('/feedback-admin/image/<identifier>')
    @private
    def screenshot(identifier):
        with connect() as db:
            row = db.execute('SELECT image FROM feedback WHERE id=?', (identifier,)).fetchone()
        if not row or not row['image']:
            return '', 404
        return Response(row['image'], mimetype='image/jpeg')

    @app.post('/feedback-admin/status/<identifier>')
    @private
    def mark(identifier):
        if request.headers.get('Origin') != app.config['ALLOWED_ORIGIN']:
            return '', 403
        state = request.form.get('status')
        if state not in ('new', 'done'):
            return '', 400
        with connect() as db:
            db.execute('UPDATE feedback SET status=? WHERE id=?', (state, identifier))
        from flask import redirect
        return redirect('/feedback-admin', code=303)

    return app
