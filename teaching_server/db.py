"""SQLite connection and explicit transactions. Author: Lliftime."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3

USERS = (
    ('alice', '教学员工甲', 'employee'),
    ('bob', '教学员工乙', 'employee'),
    ('manager', '教学主管', 'manager'),
    ('director', '教学部门负责人', 'director'),
    ('viewer', '教学无业务权限访客', 'viewer'),
)


@contextmanager
def connect(database):
    connection = sqlite3.connect(database, timeout=5, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    try:
        yield connection
    finally:
        connection.close()


@contextmanager
def transaction(connection, write=True):
    connection.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def initialize(database):
    path = Path(database)
    path.parent.mkdir(parents=True, exist_ok=True)
    with connect(path) as connection:
        version = connection.execute('PRAGMA user_version').fetchone()[0]
        tables = {r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
        if version not in (0, 1) or tables - {'lab_users', 'applications', 'application_events'}:
            raise RuntimeError('数据库不属于本教学服务或版本不支持；原数据未修改，请使用独立文件。')
        connection.executescript(Path(__file__).with_name('schema.sql').read_text('utf-8'))
        with transaction(connection):
            connection.executemany('INSERT OR IGNORE INTO lab_users(id,display_name,role) VALUES(?,?,?)', USERS)
