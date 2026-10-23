"""Isolated loopback-only Flask teaching API. Author: Lliftime.

X-Lab-User is deliberately spoofable teaching identity, NEVER production authentication.
"""
from pathlib import Path
import sqlite3
from urllib.parse import urlsplit
import uuid

from flask import Flask, g, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from . import db, service

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/api/teaching'


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.update(DATABASE=str(ROOT / 'instance/approval.sqlite3'), APPROVAL_THRESHOLD_CENTS=500000,
                      MAX_CONTENT_LENGTH=32768)
    if config:
        app.config.update(config)
    threshold = app.config['APPROVAL_THRESHOLD_CENTS']
    if type(threshold) is not int or not 0 <= threshold <= 100000000:
        raise ValueError('APPROVAL_THRESHOLD_CENTS须为非负整数分。')
    db.initialize(app.config['DATABASE'])
    instance_id = uuid.uuid4().hex

    def response(value, status=200):
        return jsonify({**value, 'request_id': g.request_id, 'mode': 'local-teaching'}), status

    def actor(connection):
        user = connection.execute('SELECT * FROM lab_users WHERE id=?',
                                  (request.headers.get('X-Lab-User', ''),)).fetchone()
        if user is None:
            raise service.RuleError(401, 'teaching_identity_required', '请选择固定教学身份（不是生产登录认证）。')
        return dict(user)

    def payload():
        if not request.is_json:
            raise service.RuleError(400, 'json_required', '请求须使用application/json。')
        value = request.get_json(silent=True)
        if not isinstance(value, dict):
            raise service.RuleError(400, 'invalid_json', '请求正文须为有效JSON对象。')
        return value

    @app.before_request
    def local_boundary():
        g.request_id = uuid.uuid4().hex
        if request.remote_addr not in ('127.0.0.1', '::1'):
            raise service.RuleError(403, 'local_only', '本教学服务仅限回环访问。')
        try:
            host = urlsplit('http://' + request.host).hostname
        except ValueError:
            host = None
        if host not in ('127.0.0.1', 'localhost', '::1'):
            raise service.RuleError(403, 'invalid_host', '仅允许本机Host，不开放公网或代理转发。')
        origin = request.headers.get('Origin')
        if request.path.startswith(PREFIX) and origin and origin != request.host_url.rstrip('/'):
            raise service.RuleError(403, 'cross_origin', '教学API只接受同源浏览器请求；命令行示例可省略Origin。')

    @app.after_request
    def headers(result):
        result.headers['X-Content-Type-Options'] = 'nosniff'
        result.headers['X-Frame-Options'] = 'DENY'
        result.headers['Referrer-Policy'] = 'same-origin'
        if request.path.startswith(PREFIX):
            result.headers['Cache-Control'] = 'no-store'
            result.headers['X-Request-ID'] = getattr(g, 'request_id', '')
            result.headers['X-Lab-Mode'] = 'local-teaching'
        return result

    @app.errorhandler(service.RuleError)
    def rule_error(error):
        return response({'error': {'code': error.code, 'message': error.message, 'fields': error.fields}}, error.status)

    @app.errorhandler(sqlite3.DatabaseError)
    def database_error(error):
        app.logger.warning('Teaching SQLite request %s failed: %s', g.request_id, type(error).__name__)
        return response({'error': {'code': 'database_error', 'message': '数据库操作未完成；本次事务已回滚，请查询后再试。'}}, 500)

    @app.errorhandler(HTTPException)
    def http_error(error):
        return response({'error': {'code': 'http_error', 'message': error.name}}, error.code)

    @app.get(PREFIX + '/health')
    def health():
        with db.connect(app.config['DATABASE']) as connection:
            version = connection.execute('PRAGMA user_version').fetchone()[0]
        return response({'service': 'approval-teaching', 'database': 'SQLite', 'schema_version': version,
                         'instance_id': instance_id, 'threshold_cents': threshold,
                         'identities': [{'id': u[0], 'name': u[1], 'role': u[2]} for u in db.USERS],
                         'scope': '固定可切换教学身份，仅本机虚构数据；没有真实通知和生产认证'})

    @app.route(PREFIX + '/applications', methods=['GET', 'POST'])
    def applications():
        with db.connect(app.config['DATABASE']) as connection:
            user = actor(connection)
            if request.method == 'POST':
                result = service.submit(connection, user, payload(), threshold, g.request_id)
                return response({'application': result}, 201)
            if user['role'] == 'viewer':
                raise service.RuleError(403, 'forbidden', '该教学访客无申请查询权限。')
            conditions, parameters = [], []
            if user['role'] == 'employee':
                conditions.append('applicant_id=?')
                parameters.append(user['id'])
            cost_center = request.args.get('cost_center')
            if cost_center is not None:
                if len(cost_center) > 40:
                    raise service.RuleError(422, 'invalid_filter', '成本中心筛选最多40字符。')
                conditions.append('cost_center=?')
                parameters.append(cost_center)
            sql = 'SELECT * FROM applications' + (' WHERE ' + ' AND '.join(conditions) if conditions else '') + ' ORDER BY id DESC LIMIT 50'
            rows = [dict(r) for r in connection.execute(sql, parameters).fetchall()]
            return response({'applications': rows, 'limit': 50})

    @app.get(PREFIX + '/applications/<int:identifier>')
    def application(identifier):
        with db.connect(app.config['DATABASE']) as connection:
            user = actor(connection)
            value = service.get_application(connection, identifier)
            service.allow_read(user, value)
            return response({'application': value})

    @app.post(PREFIX + '/applications/<int:identifier>/decisions')
    def decision(identifier):
        with db.connect(app.config['DATABASE']) as connection:
            result = service.change_status(connection, identifier, actor(connection), payload(), g.request_id)
            return response({'application': result})

    @app.post(PREFIX + '/applications/<int:identifier>/withdraw')
    def withdraw(identifier):
        with db.connect(app.config['DATABASE']) as connection:
            result = service.change_status(connection, identifier, actor(connection), payload(), g.request_id, withdrawing=True)
            return response({'application': result})

    @app.get(PREFIX + '/applications/<int:identifier>/evidence')
    def evidence(identifier):
        with db.connect(app.config['DATABASE']) as connection:
            queries = service.evidence(connection, identifier, actor(connection))
            return response({'queries': queries, 'database': 'SQLite', 'isolation': '同一个读取事务；每次HTTP重新执行参数化SQL'})

    @app.get('/')
    def index():
        return send_from_directory(ROOT, 'index.html')

    @app.get('/<path:filename>')
    def public_asset(filename):
        path = Path(filename)
        allowed_directories = {'learning', 'content', 'projects', 'training', 'feedback'}
        allowed_extensions = {'.html', '.css', '.js', '.json', '.md'}
        if any(part.startswith('.') or part == '..' for part in path.parts) or (
                filename not in {'index.html', 'desktop.css'} and
                (path.parts[0] not in allowed_directories or path.suffix not in allowed_extensions)):
            raise service.RuleError(404, 'not_found', '此路径不是公开教学资源。')
        return send_from_directory(ROOT, filename)

    return app
