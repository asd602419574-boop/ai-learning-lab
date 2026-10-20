import base64
from contextlib import closing
import hashlib
import io
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
from app import create_app


class FeedbackTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.database = str(Path(self.directory.name) / 'feedback.sqlite3')
        self.config = dict(TESTING=True, DATABASE=self.database,
                           ADMIN_PASSWORD_HASH=hashlib.sha256(b'test-password').hexdigest(),
                           ALLOWED_ORIGIN='http://localhost')
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.origin = {'Origin': 'http://localhost'}
        self.auth = {'Authorization': 'Basic ' + base64.b64encode(b'admin:test-password').decode()}

    def tearDown(self):
        self.directory.cleanup()

    def submit(self, **kwargs):
        return self.client.post('/api/feedback', json=dict(message='课程反馈', email='', page='/', **kwargs),
                                headers=self.origin)

    def test_persistence_admin_privacy_and_status(self):
        picture = io.BytesIO()
        Image.new('RGB', (20, 20), 'red').save(picture, 'PNG')
        text = '<script>alert(1)</script>'
        response = self.client.post('/api/feedback', headers=self.origin, json={
            'message': text, 'email': 'learner@example.com', 'page': '/',
            'image': 'data:image/png;base64,' + base64.b64encode(picture.getvalue()).decode()})
        self.assertEqual(response.status_code, 201)
        identifier = response.json['id']
        client = create_app(self.config).test_client()  # independent app, persisted SQLite
        self.assertEqual(client.get('/feedback-admin').status_code, 401)
        self.assertEqual(client.get('/feedback-admin/image/' + identifier).status_code, 401)
        page = client.get('/feedback-admin', headers=self.auth)
        self.assertIn(b'&lt;script&gt;', page.data)
        self.assertNotIn(text.encode(), page.data)
        image = client.get('/feedback-admin/image/' + identifier, headers=self.auth)
        self.assertEqual(image.mimetype, 'image/jpeg')
        self.assertEqual(image.headers['Cache-Control'], 'no-store')
        with Image.open(io.BytesIO(image.data)) as saved:
            self.assertEqual(saved.size, (20, 20))
        self.assertEqual(client.post('/feedback-admin/status/' + identifier,
                                    headers={**self.auth, 'Origin': 'https://evil.test'},
                                    data={'status': 'done'}).status_code, 403)
        self.assertEqual(client.post('/feedback-admin/status/' + identifier,
                                    headers={**self.auth, **self.origin},
                                    data={'status': 'done'}).status_code, 303)
        with closing(sqlite3.connect(self.database)) as db:
            self.assertEqual(db.execute('SELECT status FROM feedback').fetchone()[0], 'done')

    def test_invalid_inputs_and_origin(self):
        payload = {'message': 'hello', 'email': '', 'page': '/'}
        self.assertEqual(self.client.post('/api/feedback', json=payload).status_code, 403)
        for field, value in [('message', ' '), ('message', 'x'*2001),
                             ('email', 'bad'), ('image', 'data:image/png;base64,invalid')]:
            self.assertEqual(self.client.post('/api/feedback', headers=self.origin,
                                              json={**payload, field: value}).status_code, 400)

    def test_rate_limit(self):
        for _ in range(5):
            self.assertEqual(self.submit().status_code, 201)
        self.assertEqual(self.submit().status_code, 429)


if __name__ == '__main__':
    unittest.main()
