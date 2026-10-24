# V2.3：紧急程度需求变更实践

本轮只改变已有企业审批系统。站内入口 `/#change`，五阶段指导与双路线成果记录；没有在线IDE或远程代码执行。原 `teaching_server/`、V2.1流程课、V2.2课程和原教学数据库不做升级。

确认的规则：`urgency`为normal/urgent，缺省normal；`urgent_reason`最多500字符，urgent时去首尾空格后非空。normal可不提供原因。旧行默认normal和空原因。金额岗位、权限、pending→批准/驳回/撤回、版本与事件事务保持。独立变式为紧急原因至少12字符，不是第二个系统。

## 两条路线

业务/架构路线在站内提交需求/影响、流程边界、字段与数据约束、API契约、旧库兼容与恢复、验收表、实施安排和复盘；无需编程。结构检查只定位缺项，不按字数判断专业正确。

工程路线先做同样设计，再修改独立副本的真实代码，运行HTTP/SQLite并导入证据。可以参考完整示范，但基本示范通过不等于独立变式通过，更不能证明独立掌握。

设计稿、路线、报告与提交快照会自动保存在当前浏览器与地址，刷新可恢复；请确认界面显示保存成功。容量/权限失败或只读时保留内存稿并明确提示，仍可导出JSON。重要版本及跨端口/浏览器迁移请单独导出作品JSON；恢复时先选文件、预览、确认。新增独立键`ai_lab_change_v1`接入原多页写入保护，原九键及全站备份格式不变，V2.3仍需单独备份。工程check报告是另一个格式，从“工程报告”导入；不可当作品恢复文件混用。报告可被手工编辑，站内明确标为本地自报、未独立复核，不执行其内容。

## 准备本地环境

仓库根目录，Python3.12；可复用V2.2的虚拟环境。尚未安装时：

```sh
python3 -m venv .venv-teaching
.venv-teaching/bin/python -m pip install -r teaching_server/requirements.txt
```

Windows PowerShell：

```powershell
py -3.12 -m venv .venv-teaching
.\.venv-teaching\Scripts\python.exe -m pip install -r teaching_server/requirements.txt
```

下文macOS/Linux命令的 `.venv-teaching/bin/python`，Windows替换为 `.\.venv-teaching\Scripts\python.exe` 即可，无需激活环境或更改执行策略。

原课程可用 `.venv-teaching/bin/python -m teaching_server --port 8877` 阅读（Windows替换为上方虚拟环境解释器）；新任务不要求修改该服务。业务路线也可通过原纯静态服务阅读与导出。

## 1. 建立自己的失败基线

```sh
.venv-teaching/bin/python scripts/change_lab.py prepare my-attempt
.venv-teaching/bin/python scripts/change_lab.py check my-attempt
```

第一次check预期退出1：原v1没有紧急字段。查看具体反馈，而不是把失败当产品损坏。目录 `.change-labs/my-attempt/` 含：

- `teaching_server/`：从现有服务复制的实际Python/SQL代码，你在这里改。
- `learning/architecture-workspace.js`：原实际HTTP前端副本，你在这里加控件与JSON字段。
- `instance/approval.sqlite3`：当前练习库，只含虚构旧申请及你后续的操作。
- `baseline/`：原服务、原前端文件、虚构v1库与摘要，用于核对和重做，不要修改。
- `evidence/check-*.json`：每次验收记录，失败报告也会保留。

工具不打开主仓 `instance/approval.sqlite3`，不复制原真实教学数据；旧库是用原服务生成的三个固定虚构申请（编号1–3，用作迁移兼容样本，勿在手工操作时更改）。SQLite使用backup接口生成一致副本。实验目录已忽略Git；它仍是本机普通程序，不是安全执行沙箱。不要导入真实资料或运行陌生代码。

## 2. 自己设计并改代码

先在站内写你的设计，再按每层责任做局部修改：

1. 副本`service.py`：可选字段白名单、明确枚举、原因类型/长度/条件、参数化INSERT；紧急不改变岗位。
2. 副本`db.py`：v1→v2事务迁移，加列/默认值/枚举与跨字段约束，完成后才更新版本；再次启动不重复迁移。
3. 副本前端：draft、级别选择、原因控件、实际POST JSON；观察后端响应，不用表单值假装已保存。
4. 重跑check，沿HTTP错误、数据库行和具体反馈定位修正。

只改CREATE TABLE IF NOT EXISTS不能升级旧库。Python executescript不宜放进要求保持的显式事务；参考实现逐条execute。数据库拒绝未知等级及urgent空原因；服务端422与库约束承担不同责任。

可以用Git查看副本差异（显示差异时退出码1是Git的正常行为）：

```sh
git diff --no-index .change-labs/my-attempt/baseline/teaching_server .change-labs/my-attempt/teaching_server
git diff --no-index .change-labs/my-attempt/baseline/architecture-workspace.js .change-labs/my-attempt/learning/architecture-workspace.js
```

不要在主仓 `teaching_server` 上练习，也不要修改验收器让结果通过。没有要求学员使用与参考一模一样的代码，只要满足契约与实际数据约束。

## 3. 完整示范单独运行

```sh
.venv-teaching/bin/python scripts/change_lab.py demo worked-example
.venv-teaching/bin/python scripts/change_lab.py check worked-example
.venv-teaching/bin/python scripts/change_lab.py serve worked-example --port 8878
```

打开 [实际副本工作台](http://127.0.0.1:8878/#architecture?view=practice)。`demo`显式将`reference.patch`应用到一个新目录；对已有代码或重复目录会拒绝覆盖。参考补丁复用同一服务，仅修改db.py、service.py与原HTTP前端。它解释“完整实现怎样协作”，不替代你自己的设计、修订和独立规则。

手工选择urgent，填原因提交；核对201、GET、SQL的两个新字段；切换岗位决定；刷新按申请号重新HTTP读回。原8877与副本8878是不同浏览器来源，旧学习记录仍在原端口。不要操作1–3号固定迁移样本，新建自己的申请号。

## 4. 验收与证据

```sh
.venv-teaching/bin/python scripts/change_lab.py check my-attempt
```

check将当前源码与练习库复制到临时目录，真正启动loopback HTTP并独立读写磁盘SQLite；不会把检查请求写进当前练习库。覆盖：

- 原字段与事件保留，旧行default，旧客户端缺字段仍201。
- urgent提交、GET与独立SQLite行一致。
- 未知/空/null/数字级别与缺失/空白/null/数字/超长原因422且不新增申请。
- 数据库拒绝非法枚举和urgent空原因。
- 原批准、驳回、撤回路径200；终态再审批409，只有合法事件。
- 高额urgent仍需director，manager403；重启同库可读且迁移幂等。

报告含输入源码摘要、前端摘要、输入库摘要、每次真实请求/响应、SQL参数与行、反馈和证据范围。它主要验证后端固定规则；前端控件/请求与刷新还应按课程手工检查。报告可复现，不是代码来源签名、安全认证或专业能力评分。代码修改后必须重验，旧报告不能证明新代码。

## 5. 独立变式与恢复

先自行分析新规则“紧急原因至少12字符”，再修改你的副本服务端与数据库条件，更新提示，最后运行：

```sh
.venv-teaching/bin/python scripts/change_lab.py check my-attempt --variant
```

参考示范会失败；独立验收增加短原因HTTP422和直接SQLite写入拒绝。其他基础回归同时保留。自行补11/12/500/501字符、首尾空格的边界证据。

若当前练习库已经迁移为v2，只改v1→v2迁移代码不会更新已存在的约束。应设计下一版本迁移，在同一事务处理旧短原因的政策、重建触发器并更新版本；或从原始v1重新建立独立变式副本，但必须写明验证的是新副本而不是在途v2升级。后者是本轮自动验收使用的受控路径，不宣称覆盖任意旧库升级。

需要重做时，先Ctrl+C停自己的副本服务，再创建新名字：

```sh
.venv-teaching/bin/python scripts/change_lab.py prepare retry-2 --from-baseline my-attempt
```

这恢复最初服务、前端和虚构旧库到**新目录**；原失败尝试、当前数据库和报告保留。工具拒绝路径穿越、重复目录和被改变的基线，不自动删除或覆盖。迁移后的代码与库要成对保留；不提供自动降级或生产备份恢复。

## 6. 交付

站内提交设计、修改记录、当前报告与复盘，导出作品文件保留；本地保留源码diff及实验目录。当前提交在编辑/换路线/换报告后需重新检查；最近10份提交快照供回看。

业务路线的“结构齐全”、工程路线的“所导入固定规则通过”、真实学员的独立能力是三个不同结论。尚无真实试学、陌生需求迁移或延迟复现证据，也未实现生产身份、优先队列、通知、在线IDE或自动语义评分。

必要开发验证：`python -m unittest discover -s tests -p test_change_lab.py -v`、`node tests/test_change_core.cjs`、`node tests/test_change_browser.cjs`。浏览器测试可配置PLAYWRIGHT_MODULE、CHROME_CHANNEL及TEACHING_PYTHON，使用临时虚构库，完成后仅清理自身生成的目录。
