"""Application rules; HTTP presentation is deliberately outside this module."""
from datetime import datetime, timezone
from .db import transaction


class RuleError(Exception):
    def __init__(self, status, code, message, fields=None):
        super().__init__(message)
        self.status, self.code, self.message, self.fields = status, code, message, fields or {}


def now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')


def validate_fields(data, required, optional=()):
    if not isinstance(data, dict):
        raise RuleError(400, 'invalid_json', '请发送JSON对象。')
    missing = set(required) - data.keys()
    unknown = data.keys() - set(required) - set(optional)
    if missing or unknown:
        raise RuleError(422, 'invalid_fields', '请求字段与接口契约不一致。',
                        {'missing': sorted(missing), 'unknown': sorted(unknown)})


def string(data, key, maximum, required=True):
    value = data.get(key, '')
    if not isinstance(value, str) or len(value.strip()) > maximum or (required and not value.strip()):
        raise RuleError(422, 'invalid_field', f'{key}须为'+('非空' if required else '')+f'文字，最多{maximum}字符。', {key: 'invalid'})
    return value.strip()


def integer(value, field, minimum=1, maximum=100000000):
    if type(value) is not int or not minimum <= value <= maximum:
        raise RuleError(422, 'invalid_field', f'{field}须为{minimum}至{maximum}的整数。', {field: 'invalid'})
    return value


def get_application(connection, identifier):
    row = connection.execute('SELECT * FROM applications WHERE id=?', (identifier,)).fetchone()
    if row is None:
        raise RuleError(404, 'not_found', '申请不存在。')
    return dict(row)


def allow_read(actor, application):
    if actor['role'] not in ('manager', 'director') and not (
            actor['role'] == 'employee' and application['applicant_id'] == actor['id']):
        raise RuleError(403, 'forbidden', '当前教学身份无权读取这张申请。')


def event(connection, identifier, actor, action, before, after, version, reason, request_id, timestamp):
    connection.execute('''INSERT INTO application_events
        (application_id,actor_id,action,from_status,to_status,version,reason,request_id,created_at)
        VALUES(?,?,?,?,?,?,?,?,?)''',
        (identifier, actor['id'], action, before, after, version, reason, request_id, timestamp))


def submit(connection, actor, data, threshold, request_id):
    if actor['role'] != 'employee':
        raise RuleError(403, 'forbidden', '请切换到教学员工身份提交申请。')
    validate_fields(data, ['title', 'purpose', 'amount_cents'], ['cost_center'])
    title, purpose = string(data, 'title', 120), string(data, 'purpose', 2000)
    cost_center = string(data, 'cost_center', 40, required=False)
    amount = integer(data['amount_cents'], 'amount_cents')
    role = 'manager' if amount <= threshold else 'director'
    timestamp = now()
    with transaction(connection):
        cursor = connection.execute('''INSERT INTO applications
            (applicant_id,title,purpose,cost_center,amount_cents,threshold_cents,required_role,status,version,created_at,updated_at)
            VALUES(?,?,?,?,?,?,?,'pending',1,?,?)''',
            (actor['id'], title, purpose, cost_center, amount, threshold, role, timestamp, timestamp))
        identifier = cursor.lastrowid
        event(connection, identifier, actor, 'submitted', None, 'pending', 1, '提交并通过服务端资料校验', request_id, timestamp)
        result = get_application(connection, identifier)
    return result


def change_status(connection, identifier, actor, data, request_id, withdrawing=False):
    validate_fields(data, ['expected_version', 'reason'] if withdrawing else ['expected_version', 'reason', 'decision'])
    expected = integer(data['expected_version'], 'expected_version', maximum=2147483647)
    reason = string(data, 'reason', 2000)
    target = 'withdrawn' if withdrawing else data['decision']
    if not withdrawing and target not in ('approved', 'rejected'):
        raise RuleError(422, 'invalid_decision', 'decision仅允许approved或rejected。')
    timestamp = now()
    with transaction(connection):
        application = get_application(connection, identifier)
        allow_read(actor, application)
        if withdrawing:
            permitted = actor['role'] == 'employee' and actor['id'] == application['applicant_id']
        else:
            permitted = actor['role'] == application['required_role']
        if not permitted:
            raise RuleError(403, 'wrong_role', '当前教学岗位不具备此操作权限。')
        if application['status'] != 'pending' or application['version'] != expected:
            raise RuleError(409, 'state_conflict', '申请已处理/撤回或页面版本过期；请重新查询，不会重复写入。')
        cursor = connection.execute('''UPDATE applications
            SET status=?, version=version+1, decided_by=?, updated_at=?
            WHERE id=? AND status='pending' AND version=?''',
            (target, actor['id'], timestamp, identifier, expected))
        if cursor.rowcount != 1:
            raise RuleError(409, 'state_conflict', '状态已改变，请重新查询。')
        event(connection, identifier, actor, target, 'pending', target, expected + 1, reason, request_id, timestamp)
        result = get_application(connection, identifier)
    return result


EVIDENCE_QUERIES = (
    ('申请行', 'SELECT * FROM applications WHERE id=?'),
    ('同一申请的事件', 'SELECT * FROM application_events WHERE application_id=? ORDER BY version'),
    ('主外键关联', '''SELECT a.id, a.title, a.status, a.version, u.display_name AS applicant,
        e.action, e.version AS event_version, operator.display_name AS actor
        FROM applications a JOIN lab_users u ON a.applicant_id=u.id
        JOIN application_events e ON e.application_id=a.id
        JOIN lab_users operator ON e.actor_id=operator.id
        WHERE a.id=? ORDER BY e.version'''),
)


def evidence(connection, identifier, actor):
    # One read transaction gives all displayed queries a consistent SQLite snapshot.
    with transaction(connection, write=False):
        allow_read(actor, get_application(connection, identifier))
        queries = [{'label': label, 'sql': sql, 'parameters': [identifier],
                    'rows': [dict(row) for row in connection.execute(sql, (identifier,)).fetchall()]}
                   for label, sql in EVIDENCE_QUERIES]
    return queries
