"""Run only on loopback: python -m teaching_server --port 8877."""
import argparse
from pathlib import Path
from werkzeug.serving import make_server
from .app import create_app, ROOT


def main():
    parser = argparse.ArgumentParser(description='本机虚构数据审批实验；不是生产服务。不提供公网监听选项。')
    parser.add_argument('--port', type=int, default=8877)
    parser.add_argument('--database', type=Path, default=ROOT / 'instance/approval.sqlite3')
    parser.add_argument('--threshold-yuan', type=int, default=5000, help='新申请的高低额阈值，整数元')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535 or not 0 <= args.threshold_yuan <= 1000000:
        parser.error('端口须为1024–65535；阈值须为0–1000000整数元。')
    app = create_app({'DATABASE': str(args.database.resolve()), 'APPROVAL_THRESHOLD_CENTS': args.threshold_yuan * 100})
    server = make_server('127.0.0.1', args.port, app, threaded=True)
    print(f'本地教学服务：http://127.0.0.1:{args.port}/#architecture', flush=True)
    print(f'SQLite：{args.database.resolve()}；固定教学身份不是生产认证。', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
