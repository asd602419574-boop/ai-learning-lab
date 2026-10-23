"""Real loopback HTTP + a temporary on-disk SQLite file; no browser replay or mocked DB."""
import concurrent.futures
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
assert (ROOT / 'teaching_server/app.py').is_file(), '真实审批教学HTTP服务尚未实现'
from teaching_server.app import create_app
from werkzeug.serving import make_server


class TeachingHTTPTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / 'approval.sqlite3'
        self.start()

    def start(self, threshold=500000):
        self.app = create_app({'DATABASE': str(self.database), 'TESTING': True,
                               'APPROVAL_THRESHOLD_CENTS': threshold})
        self.server = make_server('127.0.0.1', 0, self.app, threaded=True)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def stop(self):
        self.server.shutdown()
        self.thread.join(timeout=3)
        self.server.server_close()

    def tearDown(self):
        self.stop()
        self.temp.cleanup()

    def call(self, method, path, body=None, user='alice', headers=None):
        request_headers = {'X-Lab-User': user, 'Origin': self.base}
        if body is not None:
            request_headers['Content-Type'] = 'application/json'
        request_headers.update(headers or {})
        request = urllib.request.Request(self.base + path,
            data=None if body is None else json.dumps(body).encode(),
            method=method, headers=request_headers)
        try:
            response = urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            data = response.read()
            value = json.loads(data) if 'application/json' in response.headers.get('Content-Type', '') else data
            return response.status, value

    def submit(self, amount=230000, **extra):
        return self.call('POST', '/api/teaching/applications', {
            'title': '共享设备申请', 'purpose': '虚构教学工作坊使用',
            'amount_cents': amount, 'cost_center': 'TRAINING', **extra})

    def rows(self, query, args=()):
        with sqlite3.connect(self.database) as db:
            return db.execute(query, args).fetchall()

    def test_submit_persistence_restart_and_real_sql_evidence(self):
        status, data = self.submit()
        self.assertEqual(status, 201)
        app = data['application']
        self.assertEqual((app['status'], app['version'], app['required_role']), ('pending', 1, 'manager'))
        self.assertEqual(self.rows('SELECT title, amount_cents, applicant_id FROM applications'),
                         [('共享设备申请', 230000, 'alice')])
        self.assertEqual(self.rows('SELECT action, from_status, to_status FROM application_events'),
                         [('submitted', None, 'pending')])
        self.stop()
        self.start()
        code, readback = self.call('GET', f"/api/teaching/applications/{app['id']}")
        self.assertEqual(code, 200)
        self.assertEqual(readback['application'], app)
        code, evidence = self.call('GET', f"/api/teaching/applications/{app['id']}/evidence")
        self.assertEqual(code, 200)
        self.assertEqual(evidence['queries'][0]['rows'][0]['id'], app['id'])
        self.assertIn('?', evidence['queries'][0]['sql'])
        self.assertEqual(evidence['queries'][0]['parameters'], [app['id']])

    def test_authorized_approval_and_duplicate_409_have_one_decision(self):
        _, data = self.submit()
        path = f"/api/teaching/applications/{data['application']['id']}/decisions"
        body = {'decision': 'approved', 'reason': '教学用途与资料符合要求', 'expected_version': 1}
        self.assertEqual(self.call('POST', path, body, user='alice')[0], 403)
        code, result = self.call('POST', path, body, user='manager')
        self.assertEqual(code, 200)
        self.assertEqual((result['application']['status'], result['application']['version']), ('approved', 2))
        code, error = self.call('POST', path, body, user='manager')
        self.assertEqual(code, 409)
        self.assertIn('request_id', error)
        self.assertEqual(self.rows("SELECT COUNT(*) FROM application_events WHERE action='approved'"), [(1,)])

    def test_rejection_withdrawal_and_role_threshold_variation(self):
        _, high = self.submit(500001)
        item = high['application']
        self.assertEqual(item['required_role'], 'director')
        path = f"/api/teaching/applications/{item['id']}/decisions"
        body = {'decision': 'rejected', 'reason': '虚构预算不符合', 'expected_version': 1}
        self.assertEqual(self.call('POST', path, body, user='manager')[0], 403)
        self.assertEqual(self.call('POST', path, body, user='director')[1]['application']['status'], 'rejected')
        _, lower = self.submit(500000)
        self.assertEqual(lower['application']['required_role'], 'manager')
        identifier = lower['application']['id']
        self.assertEqual(self.call('POST', f'/api/teaching/applications/{identifier}/withdraw',
                                  {'expected_version': 1, 'reason': '本次活动取消'})[0], 200)
        self.assertEqual(self.call('POST', f'/api/teaching/applications/{identifier}/decisions',
                                  body, user='manager')[0], 409)
        self.assertEqual(self.rows('SELECT status FROM applications WHERE id=?', (identifier,)), [('withdrawn',)])

    def test_validation_and_cross_user_access_do_not_mutate_database(self):
        for change in [{'purpose': ''}, {'amount_cents': True}, {'amount_cents': -1},
                       {'amount_cents': 1.5}, {'status': 'approved'}, {'applicant_id': 'bob'}]:
            self.assertEqual(self.submit(**change)[0], 422)
        self.assertEqual(self.rows('SELECT COUNT(*) FROM applications'), [(0,)])
        _, data = self.submit(title="' OR 1=1 --")
        identifier = data['application']['id']
        self.assertEqual(self.rows('SELECT title FROM applications'), [("' OR 1=1 --",)])
        self.assertEqual(self.call('GET', f'/api/teaching/applications/{identifier}', user='bob')[0], 403)
        self.assertEqual(self.call('GET', '/api/teaching/applications', user='bob')[1]['applications'], [])
        self.assertEqual(self.call('GET', f'/api/teaching/applications/{identifier}/evidence', user='viewer')[0], 403)
        self.assertEqual(self.call('GET', '/api/teaching/applications', user='')[0], 401)
        self.assertEqual(self.call('POST', '/api/teaching/applications', {}, headers={'Origin': 'https://evil.example'})[0], 403)
        for path in ['/.git/config', '/instance/approval.sqlite3', '/server/app.py', '/feedback-admin']:
            self.assertIn(self.call('GET', path)[0], (403, 404))
        self.assertEqual(self.call('GET', '/learning/process-core.js')[0], 200)

    def test_competing_decisions_and_stale_version_only_write_once(self):
        _, data = self.submit()
        path = f"/api/teaching/applications/{data['application']['id']}/decisions"
        def decide(decision):
            return self.call('POST', path, {'decision': decision, 'reason': '并发教学请求',
                                            'expected_version': 1}, user='manager')[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            codes = list(pool.map(decide, ['approved', 'rejected']))
        self.assertEqual(sorted(codes), [200, 409])
        self.assertEqual(self.rows('SELECT version FROM applications'), [(2,)])
        self.assertEqual(self.rows('SELECT COUNT(*) FROM application_events'), [(2,)])

    def test_audit_failure_rolls_back_state_in_same_sqlite_transaction(self):
        _, data = self.submit()
        with sqlite3.connect(self.database) as db:
            db.execute("CREATE TRIGGER fail_decision BEFORE INSERT ON application_events "
                       "WHEN NEW.action='approved' BEGIN SELECT RAISE(ABORT, 'injected teaching fault'); END")
        code, _ = self.call('POST', f"/api/teaching/applications/{data['application']['id']}/decisions",
                           {'decision': 'approved', 'reason': '测试原子性', 'expected_version': 1}, user='manager')
        self.assertEqual(code, 500)
        self.assertEqual(self.rows('SELECT status,version FROM applications'), [('pending', 1)])
        self.assertEqual(self.rows('SELECT COUNT(*) FROM application_events'), [(1,)])

    def test_rule_change_applies_to_new_requests_and_keeps_old_snapshot(self):
        _, old = self.submit(300000)
        self.assertEqual(old['application']['required_role'], 'manager')
        self.stop()
        self.start(threshold=200000)
        _, new = self.submit(300000)
        self.assertEqual(new['application']['required_role'], 'director')
        self.assertEqual(self.call('GET', f"/api/teaching/applications/{old['application']['id']}")[1]['application']['required_role'], 'manager')


if __name__ == '__main__':
    unittest.main()
