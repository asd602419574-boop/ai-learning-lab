# 本地审批教学服务

复用现有原生前端和Flask生态，标准库sqlite3保存数据。与 `server/` 反馈服务使用不同进程、数据库、路由及端口；不需要反馈密码或API密钥。全部示例使用虚构数据，适合单机实验。

## 启动

在仓库根目录，使用Python 3.12。macOS/Linux：

```sh
python3 -m venv .venv-teaching
.venv-teaching/bin/python -m pip install -r teaching_server/requirements.txt
.venv-teaching/bin/python -m teaching_server --port 8877
```

Windows PowerShell（无需激活环境或更改执行策略）：

```powershell
py -3.12 -m venv .venv-teaching
.\.venv-teaching\Scripts\python.exe -m pip install -r teaching_server/requirements.txt
.\.venv-teaching\Scripts\python.exe -m teaching_server --port 8877
```

打开 [课程](http://127.0.0.1:8877/#architecture)，先阅读，再进入本章实验。`Ctrl+C` 停止。启动时初始化三张表和五个固定身份，重启不会清空已有申请。默认库为仓库下 `instance/approval.sqlite3`，已Git忽略。`--database` 可指定另一份教学库；不要指向原反馈库或重要文件，初始化会拒绝未知表/版本，但不代替文件备份。

该命令只监听127.0.0.1，不支持公网监听；HTTP层还限制本地来源地址、Host及API同源Origin，不开放CORS。不要通过隧道、反向代理或 `flask run --host 0.0.0.0` 暴露。它使用本地开发服务器，没有生产认证、TLS终止或生产运维配置。

## 完成一轮真实实验

1. 选择“员工 Alice”，填写申请、用途、2300元、成本中心 `TRAINING-A`，提交。查看201及申请号；SQL证据从数据库实际查询，包含参数和行。
2. 选择“主管”，按申请号查询，使用读回的版本批准。状态为approved、版本加1，同时写入一条事件。重复批准应409，不能重复写事件。
3. 刷新页面，URL保留申请号及教学身份，重新HTTP查询SQLite中的结果。数据库文件在服务重启后仍保留；请求日志不保留。
4. 员工再提交5000.01元，所需岗位变为director；主管审批403，负责人可以批准/驳回。员工还可撤回自己的pending申请，撤回后审批409。
5. 用JSON请求台删掉purpose字段，观察422及字段反馈；修正后重新提交。增加不同cost_center，用列表过滤并核对SQL/响应。最后记录预测、观察与解释，导出会话证据。

固定教学身份：`alice` / `bob`（员工，仅查询本人并撤回本人待审批申请）、`manager`（主管）、`director`（负责人）、`viewer`（不能读写申请）。主管和负责人可读取申请，但决定必须匹配申请创建时的required_role；没有继承授权。服务端从 `X-Lab-User` 映射角色，不接受客户端提交status、applicant_id或role。这个请求头人人可伪装，只用来观察授权规则，**不是登录认证**。

默认分界5000元；修改业务条件实验（先停服务，再启动）：

```sh
.venv-teaching/bin/python -m teaching_server --port 8877 --threshold-yuan 2000
```

Windows替换解释器路径即可。新提交的2300元申请将需负责人；既有申请保留创建时的阈值和岗位快照。比较API响应、applications行及事件，解释为何不静默改变在途申请。金额请求为整数分，避免浮点金额误差。

## HTTP契约

除health外需 `X-Lab-User`；写入需 `Content-Type: application/json`。错误结构为 `error.code/message/fields`，每次响应包含request_id；请求台同时显示真实HTTP状态。常用状态：201创建、200读取/决定、401身份缺失、403岗位/来源拒绝、404未找到、409状态/版本冲突、422字段不符合规则。非法JSON返回400。

| 接口 | 请求/作用 |
|---|---|
| `GET /api/teaching/health` | 检查服务及当前阈值，不返回数据库路径 |
| `POST /api/teaching/applications` | title、purpose、amount_cents，cost_center可选 |
| `GET /api/teaching/applications?cost_center=TRAINING-A` | 当前身份可见的最近50条，可按成本中心过滤 |
| `GET /api/teaching/applications/1` | 读取数据库中的申请及版本 |
| `POST /api/teaching/applications/1/decisions` | decision为approved/rejected、expected_version整数、reason必填 |
| `POST /api/teaching/applications/1/withdraw` | expected_version整数、reason必填；仅本人pending |
| `GET /api/teaching/applications/1/evidence` | 参数化查询、实际申请行/事件/人员JOIN结果；不执行用户任意SQL |

macOS/Linux命令行示例（Windows可在站内请求台执行相同JSON）：

```sh
curl -i http://127.0.0.1:8877/api/teaching/applications \
  -H 'X-Lab-User: alice' -H 'Content-Type: application/json' \
  -d '{"title":"培训材料采购","purpose":"供虚构课程演练","amount_cents":230000,"cost_center":"TRAINING-A"}'
```

使用响应中的id替换1：

```sh
curl -i http://127.0.0.1:8877/api/teaching/applications/1/decisions \
  -H 'X-Lab-User: manager' -H 'Content-Type: application/json' \
  -d '{"decision":"approved","expected_version":1,"reason":"用途和金额已核对"}'
curl -i http://127.0.0.1:8877/api/teaching/applications/1/evidence -H 'X-Lab-User: manager'
```

状态只允许pending→approved/rejected/withdrawn，终态不能再决定。更新状态与事件在同一 `BEGIN IMMEDIATE` 事务；条件UPDATE同时检查pending及expected_version。三张表、外键与约束见 `schema.sql`；业务规则见 `service.py`。本轮不是任意V2.1模型的执行器，也没有超时、转派、会签或真实消息发送。

## 数据和验证

审批数据库与浏览器学习记录分开。换端口不会删除旧localStorage，但浏览器会把新端口视为另一个来源；原8876学习记录可继续在原端口使用，或通过既有全站备份显式恢复。新工作台不写九个旧学习键。SQLite是权威申请记录，URL保留查询号；证据JSON仅含当前会话最近50次请求、当前读回结果与反思，不是可恢复数据库备份。要保留全部教学申请，停服务后复制SQLite文件到自己的备份位置；勿上传真实个人数据。

必要自动检查（真实回环HTTP与临时磁盘库，无请求回放）：

```sh
.venv-teaching/bin/python -m unittest discover -s tests -p test_teaching_http.py -v
node tests/test_architecture_browser.cjs
```

浏览器检查需要Playwright、Chrome及已安装Flask的Python；可用 `PLAYWRIGHT_MODULE`、`CHROME_CHANNEL`、`TEACHING_PYTHON` 指向已有环境。测试创建临时库，不修改默认教学库。后端覆盖服务重启、持久化、正常/非法决定、岗位、并发竞争、实际事件写入失败回滚与阈值快照。界面检查覆盖六章阅读、字段/JSON修改、真实SQL读回、刷新查询、导出及V2.1原记录保持。通过这些检查不代表真实学员已经掌握架构知识。
