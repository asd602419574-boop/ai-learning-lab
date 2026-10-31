"""Build trusted, static textbook HTML from authored Markdown. No runtime Markdown deps."""
import json
from pathlib import Path
import mistune
ROOT=Path(__file__).resolve().parents[1]
LESSONS=[
  dict(id='ai-systems',file='01-ai-systems',title='从业务问题到 AI 系统',group='AI 基础',mins=18,prereq='无'),
  dict(id='ml-evaluation',file='02-ml-evaluation',title='机器学习与正确评估',group='AI 基础',mins=20,prereq='从业务问题到 AI 系统'),
  dict(id='neural-training',file='03-neural-training',title='神经网络与梯度下降',group='模型原理',mins=55,prereq='机器学习与正确评估',lab='gradient',quizVersion='2026-10-depth-1'),
  dict(id='transformers',file='04-transformers',title='Transformer 与语言模型',group='模型原理',mins=55,prereq='神经网络与梯度下降（数学深入可选）',lab='attention',quizVersion='2026-10-depth-1'),
  dict(id='prompt-llm',file='05-prompt-llm',title='Prompt 与可靠输出',group='生成式应用',mins=19,prereq='Transformer 与语言模型'),
  dict(id='rag',file='06-rag',title='RAG：从检索到可信引用',group='生成式应用',mins=30,prereq='Prompt 与可靠输出',lab='retrieval',quizVersion='2026-10-depth-1'),
  dict(id='agents',file='07-agents',title='Agent：工具、权限与状态',group='系统实践',mins=22,prereq='RAG：从检索到可信引用'),
  dict(id='data-delivery',file='08-data-and-delivery',title='数据标注与 AI 项目交付',group='系统实践',mins=23,prereq='机器学习与正确评估'),
]
LESSONS.extend(json.loads((ROOT/'content/extra-lessons.json').read_text('utf-8')))
QUIZZES=json.loads((ROOT/'content/lesson-quizzes.json').read_text('utf-8'))
for _lesson in LESSONS:
    _lesson['quiz']=QUIZZES[_lesson['id']]
# Only locally authored, version-controlled sources enter this build; never render learner input here.
md=mistune.create_markdown(escape=False, plugins=['table','strikethrough'])
out=ROOT/'content/rendered';out.mkdir(parents=True,exist_ok=True)
for item in LESSONS:
    stem=item['file']
    article=(ROOT/'content/lessons'/f'{stem}.md').read_text('utf-8')
    assert article.startswith('# ')
    item['file']=f'content/rendered/{stem}.html'
    item['source']=f'content/lessons/{stem}.md'
    item['chars']=len(article)
    (out/f'{stem}.html').write_text(md(article),'utf-8')
manifest={'version':'1.0','storageKey':'ai_lab_textbook_v1','lessons':LESSONS}
(ROOT/'content/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Rendered',len(LESSONS),'lessons',sum(i['chars'] for i in LESSONS),'source chars')
