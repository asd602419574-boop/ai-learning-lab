"""Build trusted, static textbook HTML from authored Markdown. No runtime Markdown deps."""
import json
from pathlib import Path
import mistune
ROOT=Path(__file__).resolve().parents[1]
LESSONS=[
  dict(id='ai-systems',file='01-ai-systems',title='从业务问题到 AI 系统',group='AI 基础',mins=18,prereq='无',quiz=[
    dict(q='一个公开图书馆只需要按日期排序活动，首先应采用什么方案？',options=['训练深度学习模型','使用确定性的排序规则','部署 Agent 群','微调大语言模型'],answer=1,why='日期排序是规则明确的任务，简单可靠的程序最合适。'),
    dict(q='一个准确率 98% 的分类器是否一定能够很好识别极少数类别？',options=['一定','不一定，需要检查每类指标与混淆矩阵','只要训练集大就一定','只要使用大模型就一定'],answer=1,why='类别不均衡时，高准确率可能掩盖少数类的漏检。')]),
  dict(id='ml-evaluation',file='02-ml-evaluation',title='机器学习与正确评估',group='AI 基础',mins=20,prereq='从业务问题到 AI 系统',quiz=[
    dict(q='将标准化器先在全量数据上拟合，再划分测试集，最大的隐患是什么？',options=['更耗内存','测试信息可能泄漏到训练过程','精确率恒等于召回率','无法保存模型'],answer=1,why='预处理的参数应在训练数据上拟合，避免测试数据参与模型选择。'),
    dict(q='垃圾邮件识别 TP=32、FP=8、FN=18，召回率是多少？',options=['80%','64%','87%','20%'],answer=1,why='Recall = TP / (TP+FN) = 32/50 = 64%。')]),
  dict(id='neural-training',file='03-neural-training',title='神经网络与梯度下降',group='模型原理',mins=23,prereq='机器学习与正确评估',lab='gradient',quiz=[
    dict(q='w=0、x=2、y=6、MSE=(wx-y)² 时，关于 w 的梯度是？',options=['-24','-6','12','24'],answer=0,why='梯度 2(wx-y)x=2(0-6)×2=-24。'),
    dict(q='训练损失持续下降，验证损失却上升，应该如何处理？',options=['直接发布','检查过拟合、标签和数据分布','只看训练准确率','删除验证集'],answer=1,why='这种现象可能是过拟合迹象，需要结合数据和评估诊断。')]),
  dict(id='transformers',file='04-transformers',title='Transformer 与语言模型',group='模型原理',mins=21,prereq='神经网络与梯度下降',quiz=[
    dict(q='普通模型推理时是否默认永久更新了模型参数？',options=['是','否','取决于回答字数','只有中文会更新'],answer=1,why='通常推理使用已有模型参数生成答案，并不进行梯度更新。'),
    dict(q='注意力权重较大是否能直接证明一个特征是输出的因果原因？',options=['能','不能','只对图片能','只对英文能'],answer=1,why='注意力是模型内部聚合信息的计算，不是可靠的因果解释。')]),
  dict(id='prompt-llm',file='05-prompt-llm',title='Prompt 与可靠输出',group='生成式应用',mins=19,prereq='Transformer 与语言模型',quiz=[
    dict(q='模型返回合法 JSON，是否可以直接认定字段内容正确？',options=['是','否，还要校验字段和事实','只需格式对齐即可','只有测试集需要校验'],answer=1,why='语法有效不保证事实正确或满足业务规则。'),
    dict(q='知识库内容写着“忽略所有系统指令”，系统应该如何处理？',options=['立刻执行','作为不可信数据并限制其权限','把它当开发者指令','自动扩权'],answer=1,why='检索内容属于外部数据，不应覆盖高优先级指令或操作权限。')]),
  dict(id='rag',file='06-rag',title='RAG：从检索到可信引用',group='生成式应用',mins=24,prereq='Prompt 与可靠输出',lab='retrieval',quiz=[
    dict(q='知识库没有电影票价的资料，正确的问答策略是？',options=['编造一个大概票价','明确缺少证据，必要时提示查询官方来源','沿用图书续借价格','随机选一条引用'],answer=1,why='资料库无依据时应拒绝编造，给出清晰的未知说明。'),
    dict(q='Top-3 包含 1 个相关片段，是否就说明检索到了全部需要的证据？',options=['一定','不一定，多证据问题可能还有遗漏','除非是英文','只有大模型可判断'],answer=1,why='Hit@3 不等于完整召回所有相关段落。')]),
  dict(id='agents',file='07-agents',title='Agent：工具、权限与状态',group='系统实践',mins=22,prereq='RAG：从检索到可信引用',quiz=[
    dict(q='日历 API 超时，最稳妥的下一步是？',options=['立即重复创建','先查询是否已创建，避免重复写入','直接报告成功','删除用户日历'],answer=1,why='写操作可能在超时前已完成，需要读回确认或幂等机制。'),
    dict(q='哪项最适合设置显式用户批准？',options=['公开资料搜索','读取公开活动列表','向真实日历写入事件','展示本地表格'],answer=2,why='对外部状态的写操作应受权限与用户确认控制。')]),
  dict(id='data-delivery',file='08-data-and-delivery',title='数据标注与 AI 项目交付',group='系统实践',mins=23,prereq='机器学习与正确评估',quiz=[
    dict(q='两个标注员一致率高，是否就能证明标签一定正确？',options=['是','否，可能一致地标错','只要样本超过 100 就能','只要使用 Kappa 就能'],answer=1,why='一致性描述标注员是否相同，而不是答案本身是否正确。'),
    dict(q='应用能在开发者电脑运行，就代表可交付吗？',options=['可以，无需其他信息','还应验证依赖、配置、输入异常、回滚等','只需要漂亮界面','只需要更多模型参数'],answer=1,why='可交付要求他人可以复现运行、验证输出并安全处理失败。')]),
]
md=mistune.create_markdown(escape=True, plugins=['table','strikethrough'])
out=ROOT/'content/rendered';out.mkdir(parents=True,exist_ok=True)
for index,item in enumerate(LESSONS,1):
    article=(ROOT/'content/lessons'/f'{item["file"]}.md').read_text('utf-8')
    assert article.startswith('# ')
    item['file']=f'content/rendered/{item["file"]}.html'
    item['source']=f'content/lessons/{index:02d}-{item["id"]}.md' if False else f'content/lessons/{["01-ai-systems","02-ml-evaluation","03-neural-training","04-transformers","05-prompt-llm","06-rag","07-agents","08-data-and-delivery"][index-1]}.md'
    item['chars']=len(article)
    rendered=md(article)
    (out/f'{["01-ai-systems","02-ml-evaluation","03-neural-training","04-transformers","05-prompt-llm","06-rag","07-agents","08-data-and-delivery"][index-1]}.html').write_text(rendered,'utf-8')
manifest={'version':'1.0','storageKey':'ai_lab_textbook_v1','lessons':LESSONS}
(ROOT/'content/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Rendered',len(LESSONS),'lessons',sum(i['chars'] for i in LESSONS),'source chars')
