# 反馈功能

前端入口位于侧栏及学习功能导航的「反馈与建议」。支持 2000 字、可选邮箱、一张 PNG/JPEG/WebP 截图（原图不超过 5MB），可选择、拖放、粘贴、预览或移除。失败保留当前草稿，不伪报成功。不发送学习记录。

后端复用 [Flask](https://github.com/pallets/flask)（BSD-3-Clause）、[Pillow](https://github.com/python-pillow/Pillow)（MIT-CMU）、[Gunicorn](https://github.com/benoitc/gunicorn)（MIT）。版本固定于 `server/requirements.txt`。SQLite 为 Python 自带模块。依赖升级后需验证上传、鉴权和持久化链路。

## 接口

- `POST /api/feedback`：JSON `{message,email,page,image}`，image 为可选图片 data URL；服务器检查来源、字段、实际图片格式和大小，解码重编码以去除元数据，SQLite 保存。成功返回 201 和反馈编号。
- `/feedback-admin`：HTTP Basic 管理员收件箱，分页、截图查看、标为已处理/待处理。账号 `admin`；生产必须 HTTPS。
- `/feedback-admin/image/<id>`：需同样鉴权，截图无公开下载路径。
- 每 IP 10 分钟 5 次提交、5 分钟 10 次失败登录；进程重启后限流计数重置。仅支持一进程，线程安全。

## 本地运行

创建虚拟环境并安装 `server/requirements.txt`。环境变量 `FEEDBACK_ADMIN_PASSWORD_HASH` 必须为管理员密码的 SHA256（64 位小写十六进制），`FEEDBACK_DATABASE` 指向私有 SQLite 文件，`FEEDBACK_ORIGIN` 为实际前端 origin。不要提交明文密码或数据库。

从项目根目录运行 `python -m flask --app server.app:create_app run --port 8766`。本地开发将静态资源与 API 通过同源代理暴露；不得对公网开放 Flask 开发服务器。

验证：`python -m unittest discover -s tests -p test_feedback.py -v`。

## 生产部署准备

只对 `learn.liftime.xyz` 增加反馈服务。创建专用 `learn-feedback` 系统用户；代码放 `/opt/learn-feedback/current`，虚拟环境 `/opt/learn-feedback/venv`。systemd 模板 `server/learn-feedback.service` 仅监听回环 8766。私有数据放 `/var/lib/learn-feedback`，不放 Web 根目录。

`/etc/learn-feedback.env`（root:root 0600）配置密码哈希、数据库路径和 origin。管理员密码由部署者本地随机生成，单独保存在本地私密交接文件，不进入仓库或聊天。服务启动前确认端口未占用。

备份学习站入口、现有 `feedback/`（如有）、该站 Nginx 配置。先部署反馈资源及服务；仅在该域名 HTTPS server 内接入 `server/nginx-feedback.conf` 的三个 location，`nginx -t` 成功后 reload。最后替换入口。其他域名、证书及 Ops/Gateway 不变。验证真实提交、管理员鉴权、截图和服务重启后数据保留，使用虚构测试内容。

回滚：恢复原入口及该站 Nginx 配置，验证配置后 reload；停止新反馈服务。保留 SQLite 数据库及发布备份，不能删除已收到的反馈。旧学习站可继续运行。

反馈仅管理员查看，暂无自动邮件、跨设备学习同步或自动清理。共享设备建议管理员用隐私窗口，结束后关闭窗口。
