const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');
const indexPath = path.join(repoDir, 'index.html');
const learningLessons = JSON.parse(fs.readFileSync(path.join(repoDir, 'content/manifest.json'), 'utf8')).lessons.map(({id,title,group,mins,prereq,lab})=>({id,title,group,mins,prereq,lab}));
const courseData = fs.readFileSync(path.join(repoDir, 'content/foundations.js'), 'utf8').trimEnd() + '\n';

const part1 = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="面向 AI 初学者的自主学习工作台：完整教学、六步实践、证据核对、即时反馈与个人成果；保留系统教材、基础练习及浏览器项目。">
  <title>AI 学习工作台 · 从理解到实践</title>
  <style>
    :root{
      --bg:#faf9f6;
      --bg-sunk:#f2f2ee;
      --surface:#ffffff;
      --ink:#1f272c;
      --ink-secondary:#48535a;
      --muted:#738089;
      --line:#e3e6e3;
      --line-subtle:#edf0ed;
      --accent:#176b75;
      --accent-dark:#13555d;
      --accent-soft:#edf5f5;
      --accent-border:#c8dede;
      --teal:#176b75;
      --teal-soft:#edf5f5;
      --amber:#b45309;
      --amber-soft:#fffbeb;
      --red:#c2410c;
      --red-soft:#fff7ed;
      --shadow-sm:0 1px 2px rgba(0,0,0,0.03);
      --shadow:0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
      --shadow-hover:0 2px 6px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.03);
      --radius-sm:6px;
      --radius:8px;
      --radius-lg:12px;
      --sidebar-w:210px;
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
    button{font:inherit;cursor:pointer}
    button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    button:disabled{cursor:not-allowed;opacity:.5}
    .shell{max-width:1440px;padding:0 24px;margin:0 auto}

    /* Topbar on Mobile */
    .topbar{position:sticky;top:0;z-index:100;height:52px;background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
    .topbar-in{height:100%;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .mobile-menu-toggle{width:36px;height:36px;border-radius:var(--radius-sm);border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;font-size:16px}
    .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
    .brand-mark{width:30px;height:30px;border-radius:7px;background:var(--accent);color:#ffffff;display:grid;place-items:center;font-size:16px;font-weight:700;flex-shrink:0}
    .brand strong{display:block;font-size:14px;font-weight:700;color:var(--ink);line-height:1.25}
    .brand small{display:block;font-size:9.5px;letter-spacing:1.2px;color:var(--muted);font-weight:700;margin-top:2px}

    .top-right{display:flex;align-items:center;gap:10px}
    .header-pill{border:1px solid var(--accent-border);background:var(--accent-soft);color:var(--accent);border-radius:999px;font-size:11.5px;font-weight:600;padding:4px 10px;white-space:nowrap}
    .header-feedback-btn{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);background:var(--surface);color:var(--ink-secondary);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;white-space:nowrap;transition:all .15s ease}
    .header-feedback-btn:hover,.header-feedback-btn.active{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}

    /* Mobile Subbar */
    .mobile-subbar{display:none;position:sticky;top:52px;z-index:85;background:var(--surface);border-bottom:1px solid var(--line);padding:8px 16px;align-items:center;justify-content:space-between;gap:10px}
    .drawer-toggle-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--bg-sunk);border-radius:var(--radius-sm);padding:6px 12px;font-size:12px;font-weight:600;color:var(--ink);max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

    /* Main Full-Bleed Desktop Workspace Layout */
    .layout{display:grid;grid-template-columns:var(--sidebar-w) minmax(0,1fr);min-height:100vh;width:100%;margin:0;padding:0}
    .sidebar{position:sticky;top:0;left:0;height:100vh;max-height:100vh;width:var(--sidebar-w);min-width:var(--sidebar-w);max-width:var(--sidebar-w);display:flex;flex-direction:column;background:var(--surface);border-right:1px solid var(--line);padding:16px 12px 14px 14px;box-sizing:border-box;overflow:hidden;z-index:50}

    .sidebar-header{flex-shrink:0;display:flex;flex-direction:column;gap:12px;margin-bottom:8px}
    .sidebar-brand{padding:0 2px 10px;border-bottom:1px solid var(--line)}

    .main-nav{display:flex;flex-direction:column;gap:3px;padding:0}
    .nav-item{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:transparent;border:1px solid transparent;border-radius:var(--radius-sm);padding:7px 10px;color:var(--ink-secondary);font-size:13.5px;font-weight:600;transition:all .15s ease}
    .nav-item:hover{background:var(--bg-sunk);color:var(--ink)}
    .nav-item.active{background:var(--surface);color:var(--accent);border-color:var(--line);font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.03)}

    /* Zone 2: Independently scrollable catalog */
    .side-panel{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;display:flex;flex-direction:column;gap:8px;padding:4px 4px 12px 0}
    .side-overline{font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:1px;text-transform:uppercase;padding:0 4px;margin-bottom:2px}
    .side-track-switcher{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;background:var(--bg-sunk);padding:3px;border-radius:var(--radius-sm);margin-bottom:8px}
    .side-track-pill{border:0;background:transparent;padding:5px 2px;font-size:11px;font-weight:600;color:var(--muted);border-radius:4px;text-align:center;cursor:pointer;transition:all .15s ease}
    .side-track-pill:hover{color:var(--ink)}
    .side-track-pill.active{background:var(--surface);color:var(--accent);font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.04)}

    .side-group-title{font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:.5px;padding:8px 4px 4px}
    .chapter-nav{display:flex;flex-direction:column;gap:3px}
    .chapter-button{display:flex;align-items:center;gap:8px;text-align:left;background:transparent;border:1px solid transparent;border-radius:var(--radius-sm);padding:6px 8px;width:100%;color:var(--ink);transition:background .15s,border-color .15s;cursor:pointer}
    .chapter-button:hover{background:var(--bg-sunk)}
    .chapter-button.active{background:var(--surface);border-color:var(--accent-border);color:var(--accent);font-weight:600}
    .chapter-no{width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:5px;background:var(--bg-sunk);color:var(--muted);font-weight:700;font-size:11px}
    .chapter-button.active .chapter-no{background:var(--accent);color:#fff}
    .chapter-button.passed:not(.active) .chapter-no{background:var(--teal-soft);color:var(--accent)}
    .chapter-meta{min-width:0;flex:1}
    .chapter-meta strong{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
    .chapter-meta small{display:block;color:var(--muted);font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}

    .side-home-stats{display:grid;gap:6px;padding:4px 6px 8px}
    .side-home-stats>div{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
    .side-home-stats strong{color:var(--ink);font-weight:600}
    .book-sidebar-progress{background:var(--bg-sunk);height:4px;border-radius:999px;overflow:hidden;margin:4px 6px 8px}
    .book-sidebar-progress span{display:block;height:100%;background:var(--accent);border-radius:inherit;transition:width .25s ease}

    .side-sub-footer{border-top:1px solid var(--line-subtle);margin-top:10px;padding-top:10px;display:flex;flex-direction:column;gap:4px}
    .side-sub-footer button{background:transparent;border:0;color:var(--muted);font-size:11.5px;padding:4px 6px;text-align:left;cursor:pointer;border-radius:4px;transition:all .15s ease}
    .side-sub-footer button:hover{color:var(--ink);background:var(--bg-sunk)}
    .side-sub-footer .side-link-btn{color:var(--accent);font-weight:600}

    /* Zone 3: Bottom fixed footer */
    .side-global-footer{flex-shrink:0;margin-top:auto;padding-top:10px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px;background:var(--surface)}
    .side-global-footer .header-feedback-btn{width:100%;justify-content:center;border-radius:var(--radius-sm)}
    .side-storage-note{font-size:11px;color:var(--muted);text-align:center}

    /* Content Area */
    .content{min-width:0;width:100%;padding:24px 36px 60px;box-sizing:border-box}

    /* Home Area: Header, Progress & Hub */
    .home-head{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:20px;box-shadow:var(--shadow-sm)}
    .home-title-row{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:16px}
    .home-heading{font-size:20px;font-weight:700;color:var(--ink);margin:0 0 4px;letter-spacing:-0.3px}
    .home-subheading{font-size:13px;color:var(--muted);margin:0}
    .home-stats-chips{display:flex;gap:8px;flex-wrap:wrap}
    .home-chip{font-size:11.5px;font-weight:600;color:var(--ink-secondary);background:var(--bg-sunk);border:1px solid var(--line);border-radius:999px;padding:3px 10px}

    .home-progress-compact{display:flex;align-items:center;gap:16px;padding-top:14px;border-top:1px solid var(--line-subtle)}
    .home-prog-info{min-width:140px;display:flex;align-items:baseline;gap:8px}
    .home-prog-label{font-size:12px;color:var(--muted)}
    .home-prog-info strong{font-size:13px;color:var(--ink)}
    .home-prog-bar{flex:1;height:6px;background:var(--bg-sunk);border-radius:999px;overflow:hidden}
    .home-prog-bar>span{display:block;height:100%;border-radius:999px;background:var(--accent);transition:width .3s ease}
    .home-prog-pct{font-size:13px;font-weight:700;color:var(--accent);min-width:36px;text-align:right}

    /* Home Hub: Smart Resume */
    .home-resume{background:var(--surface);border:1px solid var(--accent-border);border-left:4px solid var(--accent);border-radius:var(--radius-lg);padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;box-shadow:var(--shadow-sm)}
    .home-resume-main{min-width:0}
    .resume-badge{display:inline-block;font-size:10.5px;font-weight:750;letter-spacing:1px;color:var(--accent);text-transform:uppercase;margin-bottom:4px}
    .home-resume-main h3{margin:0 0 4px;font-size:16.5px;font-weight:700;color:var(--ink)}
    .home-resume-main p{margin:0;font-size:13px;color:var(--ink-secondary);line-height:1.5}
    .home-resume-action{flex-shrink:0}

    /* Section Headings */
    .home-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 12px;padding:0 2px}
    .home-section-title{font-size:15px;font-weight:700;color:var(--ink);margin:0}
    .home-section-subtitle{font-size:12px;color:var(--muted)}

    /* Tracks Grid */
    .home-tracks-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:22px}
    .home-track-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:18px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;cursor:pointer;transition:all .15s ease;box-shadow:var(--shadow-sm)}
    .home-track-card:hover{border-color:var(--accent-border);box-shadow:var(--shadow);transform:translateY(-1px)}
    .home-track-top{width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .home-track-icon{font-size:18px;line-height:1}
    .home-track-badge{font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:999px}
    .home-track-card h4{margin:0 0 6px;font-size:15px;font-weight:700;color:var(--ink)}
    .home-track-card p{margin:0 0 14px;font-size:12.5px;color:var(--muted);line-height:1.6;flex:1}
    .home-track-cta{font-size:12px;font-weight:600;color:var(--accent);display:inline-flex;align-items:center;gap:4px}

    /* Quick Practice Row */
    .home-quick-practice{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:18px 20px;margin-bottom:20px;box-shadow:var(--shadow-sm)}
    .home-quick-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .home-quick-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius);background:var(--bg-sunk);text-align:left;cursor:pointer;transition:all .15s ease}
    .home-quick-btn:hover{border-color:var(--accent-border);background:var(--surface);box-shadow:0 2px 6px rgba(0,0,0,0.03)}
    .home-quick-btn .quick-icon{font-size:18px;flex-shrink:0}
    .home-quick-btn div strong{display:block;font-size:12.5px;font-weight:600;color:var(--ink)}
    .home-quick-btn div small{display:block;font-size:11px;color:var(--muted);margin-top:1px}
    .home-footnote{font-size:11.5px;color:var(--muted);text-align:center;margin:18px 0 0}

    /* Section Header & Subnav in Content */
    .section-header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:18px}
    .eyebrow{color:var(--accent);font-size:11px;font-weight:750;letter-spacing:1.5px}
    .section-header h2{font-size:24px;margin:4px 0 4px;letter-spacing:-.4px;line-height:1.35;color:var(--ink)}
    .section-header p{font-size:13.5px;color:var(--ink-secondary);margin:0;line-height:1.7;max-width:650px}
    .status-pill{background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);white-space:nowrap;border-radius:999px;padding:4px 11px;font-size:12px;font-weight:600;margin-top:14px}
    .status-pill.complete{background:var(--teal-soft);border-color:#a7f3d0;color:#065f46}

    .tabs{display:flex;gap:4px;margin-bottom:18px;border-bottom:1px solid var(--line);overflow-x:auto}
    .tab{color:var(--muted);background:transparent;border:0;border-bottom:2px solid transparent;font-weight:600;font-size:13px;padding:10px 14px;white-space:nowrap;transition:color .15s}
    .tab:hover{color:var(--ink)}
    .tab.active{color:var(--accent);border-color:var(--accent);font-weight:700}

    .panel{border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface);box-shadow:var(--shadow-sm);padding:24px}
    .panel-title{font-weight:750;font-size:16px;margin:0 0 4px;color:var(--ink)}
    .panel-sub{font-size:12.5px;color:var(--muted);margin:0}

    /* Common Components: Deep dive, concepts, flashcards, quizzes */
    .concept-list{display:grid;gap:8px;margin-top:18px}
    .concept{border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
    .concept-head{width:100%;background:var(--surface);text-align:left;border:0;padding:12px 14px;display:flex;align-items:center;gap:11px}
    .concept-head:hover{background:var(--bg-sunk)}
    .concept-index{display:grid;place-items:center;flex:0 0 26px;width:26px;height:26px;border-radius:6px;background:var(--accent-soft);color:var(--accent);font-size:11.5px;font-weight:750}
    .concept-name{font-weight:600;font-size:13.5px;flex:1;color:var(--ink)}
    .chevron{color:var(--muted);font-size:14px}
    .concept-body{background:var(--bg);border-top:1px solid var(--line-subtle);padding:14px 16px 16px 51px;font-size:13px;color:var(--ink-secondary);line-height:1.8}
    .concept-body p{margin:0}
    .insight{border-radius:var(--radius);margin-top:16px;background:#f0fdfa;display:flex;gap:11px;padding:14px 16px;border:1px solid #ccfbf1}
    .insight i{font-style:normal;font-size:18px}
    .insight strong{color:#0f766e;font-size:13px}
    .insight p{font-size:13px;margin:3px 0 0;color:#134e4a;line-height:1.8}
    .footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:20px;gap:10px;flex-wrap:wrap}

    .btn{background:var(--accent);border:1px solid var(--accent);border-radius:var(--radius-sm);color:white;font-weight:600;font-size:13px;padding:8px 16px;transition:background .15s ease;white-space:nowrap}
    .btn:hover:not(:disabled){background:var(--accent-dark);border-color:var(--accent-dark)}
    .btn-secondary{background:var(--surface);color:var(--ink-secondary);border-color:var(--line)}
    .btn-secondary:hover:not(:disabled){background:var(--bg-sunk);color:var(--ink)}
    .btn-success{background:var(--accent);border-color:var(--accent)}
    .btn-success:hover:not(:disabled){background:var(--accent-dark)}
    .micro{font-size:12px;color:var(--muted)}

    .flash-layout{max-width:650px;margin:0 auto}
    .flash-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:0 0 14px}
    .flash-top span{font-size:12px;color:var(--muted)}
    .flash-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);width:100%;min-height:240px;padding:26px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px;color:var(--ink);box-shadow:var(--shadow-sm);transition:all .15s ease}
    .flash-card:hover{border-color:var(--accent-border);background:var(--bg-sunk)}
    .flash-card.is-back{background:var(--surface);border-color:#a7f3d0}
    .flash-small{font-size:11px;color:var(--accent);font-weight:750;letter-spacing:1px}
    .flash-card.is-back .flash-small{color:#059669}
    .flash-primary{font-size:clamp(19px,2.5vw,24px);font-weight:750;line-height:1.5}
    .flash-card.is-back .flash-primary{font-weight:600;font-size:15.5px}
    .flash-help{font-size:12px;color:var(--muted)}
    .flash-controls{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:16px}
    .flash-controls .btn{min-width:96px}
    .known-count{text-align:center;margin-top:14px;color:var(--muted);font-size:12px}

    .quiz-step{color:var(--muted);font-weight:600;font-size:12px;display:flex;justify-content:space-between;align-items:center}
    .quiz-question{font-weight:750;font-size:18px;line-height:1.6;margin:14px 0 18px;color:var(--ink)}
    .choice-list{display:grid;gap:9px}
    .choice{border:1px solid var(--line);background:var(--surface);border-radius:var(--radius-sm);display:flex;align-items:center;gap:11px;text-align:left;color:var(--ink);padding:11px 13px;line-height:1.6;font-size:13.5px}
    .choice:hover:not(:disabled){border-color:var(--accent-border);background:var(--bg-sunk)}
    .choice.selected{border-color:var(--accent);background:var(--accent-soft)}
    .choice.correct{border-color:#a7f3d0;background:#ecfdf5}
    .choice.wrong{border-color:#fecdd3;background:#fff1f2}
    .choice-letter{width:24px;height:24px;display:grid;place-items:center;border-radius:5px;background:var(--bg-sunk);font-size:11.5px;font-weight:750;flex:0 0 auto}
    .choice.selected .choice-letter{background:var(--accent);color:#fff}
    .feedback{padding:14px 16px;border-radius:var(--radius-sm);background:#ecfdf5;color:#065f46;font-size:13px;margin-top:16px;border:1px solid #a7f3d0}
    .feedback.incorrect{color:#991b1b;background:#fef2f2;border-color:#fecaca}
    .feedback strong{display:block;margin-bottom:4px}
    .feedback p{margin:0;line-height:1.7}
    .quiz-result{text-align:center;padding:12px 0}
    .score-ring{height:108px;width:108px;border:6px solid #d1fae5;border-radius:100px;display:grid;place-items:center;margin:0 auto 14px;font-size:28px;font-weight:800;color:var(--accent)}
    .quiz-result h3{font-size:20px;margin:0 0 6px}
    .quiz-result p{color:var(--muted);font-size:13px}
    .review{display:grid;gap:8px;text-align:left;margin:20px 0}
    .review-item{border:1px solid var(--line);border-radius:var(--radius-sm);padding:13px;font-size:12px;background:var(--surface)}
    .review-item strong{display:block;font-size:13px;margin-bottom:4px}
    .review-item p{margin:4px 0;color:var(--muted);line-height:1.7}
    .review-item .answer{color:var(--accent);font-weight:600}
    .result-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}

    .deep-list{display:grid;gap:10px;margin:18px 0 22px}
    .deep-card{border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--surface)}
    .deep-card[open]{border-color:var(--accent-border);background:var(--surface)}
    .deep-card summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:11px;padding:14px 16px;font-size:13.5px}
    .deep-card summary::-webkit-details-marker{display:none}
    .deep-card summary strong{flex:1;color:var(--ink)}
    .deep-card summary:hover{background:var(--bg-sunk)}
    .deep-num{background:var(--bg-sunk);color:var(--ink-secondary);width:26px;height:26px;flex:0 0 26px;border-radius:6px;display:grid;place-items:center;font-weight:750;font-size:11.5px}
    .deep-toggle{font-size:11px;color:var(--muted)}
    .deep-detail{border-top:1px solid var(--line-subtle);padding:14px 18px 16px;font-size:13px;line-height:1.9;color:var(--ink-secondary)}
    .deep-detail>p{margin:0 0 10px}
    .scenario,.pitfall{border-radius:var(--radius-sm);padding:11px 14px;margin-top:9px}
    .scenario{background:#f0fdf4;border:1px solid #dcfce7}
    .pitfall{background:#fffbeb;border:1px solid #fef3c7}
    .scenario strong{color:#15803d}
    .pitfall strong{color:#b45309}
    .scenario p,.pitfall p{margin:3px 0 0}
    .section-divider{margin-top:24px;border-top:1px solid var(--line);padding-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px}
    .section-divider strong{font-size:15px;color:var(--ink)}
    .section-divider span{font-size:12px;color:var(--muted)}
    .mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}
    .mode-card{border:1px solid var(--line);background:var(--bg-sunk);padding:18px;border-radius:var(--radius);display:flex;flex-direction:column;align-items:flex-start;gap:8px}
    .mode-card h3{margin:0;font-size:15.5px;color:var(--ink)}
    .mode-card p{font-size:12px;color:var(--muted);margin:0;min-height:36px}
    .mode-card button{margin-top:auto}
    .practice-stats{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:12px}

    /* Wrong questions */
    .wrong-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .wrong-chip-list{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}
    .wrong-chip{background:var(--bg-sunk);color:var(--ink-secondary);border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600}
    .wrong-list{display:grid;gap:10px;margin-top:14px}
    .wrong-item{border:1px solid var(--line);background:var(--surface);border-radius:var(--radius);padding:16px}
    .wrong-item h4{font-size:13.5px;line-height:1.65;margin:6px 0 8px}
    .wrong-category{font-size:11px;color:var(--accent);font-weight:750}
    .wrong-item details{font-size:12px;color:var(--ink-secondary);line-height:1.75}
    .wrong-item details summary{cursor:pointer;color:var(--accent);font-weight:750}
    .wrong-item details p{margin:6px 0}
    .wrong-item-actions{display:flex;gap:14px;margin-top:10px}
    .wrong-item-actions button{color:var(--accent);font-size:12px;font-weight:600;background:none;border:0;padding:0;cursor:pointer}
    .wrong-item-actions button:hover{text-decoration:underline}
    .empty-state{text-align:center;padding:36px 10px}
    .empty-icon{font-size:36px}
    .empty-state h3{font-size:18px;margin:8px 0}
    .empty-state p{color:var(--muted);font-size:13px;line-height:1.75;max-width:460px;margin:0 auto 16px}

    /* Active recall & Review */
    .recall-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);min-height:220px;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;width:100%;box-shadow:var(--shadow-sm);transition:all .15s ease}
    .recall-card.revealed{border-color:#a7f3d0}
    .recall-eyebrow{font-size:10.5px;font-weight:750;letter-spacing:1px;color:var(--accent);text-transform:uppercase}
    .recall-text{font-size:clamp(18px,2.4vw,24px);font-weight:750;line-height:1.6;max-width:580px}
    .recall-card.revealed .recall-text{font-size:15.5px;font-weight:550}
    .recall-reminder{font-size:11.5px;color:var(--muted)}
    .rating-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}
    .rating{border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface);padding:10px 4px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;transition:all .15s ease}
    .rating:hover{background:var(--bg-sunk);border-color:var(--accent-border)}
    .rating small{display:block;font-size:10px;font-weight:500;color:var(--muted);margin-top:1px}
    .recall-note{font-size:12px;color:var(--muted);padding:10px 0;line-height:1.7}
    .empty-memory{text-align:center;padding:28px 16px}
    .empty-memory h3{margin:8px 0}
    .empty-memory p{font-size:13px;color:var(--muted)}

    /* Labs & Missions */
    .lab-selector{display:flex;gap:7px;margin:0 0 18px;flex-wrap:wrap}
    .lab-selector button{border:1px solid var(--line);color:var(--ink-secondary);background:var(--surface);border-radius:var(--radius-sm);padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer}
    .lab-selector button.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .lab-console{background:var(--bg-sunk);border-radius:var(--radius-lg);padding:20px;border:1px solid var(--line)}
    .lab-top{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:12px}
    .lab-top h3{margin:0;font-size:17px;color:var(--ink)}
    .lab-top p{font-size:12px;color:var(--muted);margin:3px 0 0}
    .lab-setting{border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px;background:var(--surface);margin-bottom:12px}
    .lab-setting label{display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;gap:14px;margin-bottom:8px}
    .lab-setting input[type=range]{width:100%;accent-color:var(--accent);cursor:pointer}
    .lab-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}
    .lab-metric{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 6px;text-align:center}
    .lab-metric strong{display:block;font-size:18px;color:var(--accent);line-height:1.25}
    .lab-metric span{display:block;margin-top:3px;font-size:11px;color:var(--muted)}
    .lab-devices{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
    .lab-device{border:1px solid var(--line);padding:8px 6px;background:var(--surface);border-radius:var(--radius-sm);text-align:center}
    .lab-device b{display:block;font-size:14px}
    .lab-device small{display:block;color:var(--muted);font-size:10px;margin-top:1px}
    .lab-device.positive{background:#ecfdf5;border-color:#a7f3d0}
    .lab-device.false-positive{background:#fffbeb;border-color:#fde68a}
    .lab-device.false-negative{background:#fff1f2;border-color:#fecdd3}
    .lab-notice{border-left:3px solid var(--accent);background:var(--surface);color:var(--ink);border-radius:var(--radius-sm);padding:11px 13px;font-size:12px;margin-top:14px;line-height:1.75;border:1px solid var(--line);border-left:3px solid var(--accent)}
    .train-segments{height:28px;display:flex;overflow:hidden;border-radius:var(--radius-sm);margin:10px 0 7px}
    .train-segments span{height:100%;display:flex;align-items:center;justify-content:center;min-width:0;font-size:10px;font-weight:700;color:white;white-space:nowrap}
    .split-train{background:var(--accent)}
    .split-valid{background:#0d9488}
    .split-test{background:#d97706}
    .lab-toggle{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;margin-top:14px;cursor:pointer}
    .lab-toggle input{accent-color:var(--accent);width:15px;height:15px}

    .quest-step{border:1px solid var(--line);background:var(--bg-sunk);padding:20px;border-radius:var(--radius-lg)}
    .quest-step h3{margin:7px 0 8px;font-size:18px;line-height:1.5;color:var(--ink)}
    .quest-step p{color:var(--ink-secondary);font-size:13px;line-height:1.8}
    .quest-choices{display:grid;gap:9px;margin:14px 0}
    .quest-choice{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-sm);padding:11px 14px;text-align:left;font-size:13px;font-weight:600;line-height:1.6;cursor:pointer}
    .quest-choice:hover{border-color:var(--accent-border);background:var(--bg-sunk)}
    .quest-choice.selected{border-color:var(--accent);background:var(--accent-soft)}
    .quest-feedback{padding:12px 14px;border-radius:var(--radius-sm);font-size:12.5px;margin-top:10px;line-height:1.75}
    .quest-feedback.good{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}
    .quest-feedback.bad{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
    .quest-end{text-align:center;padding:28px 14px}
    .quest-end .quest-icon{font-size:40px}
    .quest-end h3{font-size:20px}
    .quest-dots{display:flex;gap:6px;margin:0 0 14px}
    .quest-dot{width:32px;height:5px;border-radius:20px;background:var(--line)}
    .quest-dot.done{background:var(--accent)}
    .quest-dot.active{background:var(--ink)}

    .footnote{text-align:center;margin-top:28px;color:var(--muted);font-size:11.5px}
    .hidden{display:none!important}

    /* Sidebar Drawer Backdrop */
    .sidebar-backdrop{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.35);z-index:998;opacity:0;pointer-events:none;transition:opacity .25s ease}
    .sidebar-backdrop.open{opacity:1;pointer-events:auto}

    /* Responsive queries */
    @media(min-width:881px){
      .topbar{display:none!important}
      .mobile-subbar{display:none!important}
      .mobile-menu-toggle{display:none!important}
    }
    @media(max-width:880px){
      .main-nav{display:flex}
      .mobile-menu-toggle{display:grid}
      .mobile-subbar{display:flex}
      .layout{display:block;padding-top:0}
      .sidebar{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;height:100vh;z-index:999;transform:translateX(-100%);transition:transform .25s ease;background:var(--surface);box-shadow:0 10px 40px rgba(0,0,0,0.2);border-radius:0;padding:16px 14px;overflow:hidden}
      .content{padding:16px 16px 40px}
      .sidebar.drawer-open{transform:translateX(0)}
      .sidebar-backdrop{display:block}
      .home-tracks-grid{grid-template-columns:1fr}
      .home-quick-row{grid-template-columns:repeat(2,minmax(0,1fr))}
      .home-resume{flex-direction:column;align-items:flex-start}
      .home-resume-action{width:100%}
      .home-resume-action .btn{width:100%}
    }
    @media(max-width:540px){
      .topbar{height:48px}
      .top-right .header-pill{display:none}
      .header-feedback-btn{padding:4px 8px;font-size:11.5px}
      .home-head{padding:14px 16px}
      .home-progress-compact{flex-wrap:wrap;gap:8px}
      .home-prog-info{width:100%;justify-content:space-between}
      .home-prog-bar{width:calc(100% - 46px)}
      .home-quick-row{grid-template-columns:1fr}
      .home-title-row{margin-bottom:10px}
      .home-stats-chips{display:none}
      .home-prog-info{white-space:nowrap}
      .panel{padding:16px 14px}
    }
  </style>
  <link rel="stylesheet" href="./content/reader.css">
  <link rel="stylesheet" href="./projects/projects.css">
  <link rel="stylesheet" href="./training/training.css">
  <link rel="stylesheet" href="./feedback/feedback.css">
  <link rel="stylesheet" href="./content/home.css">
  <link rel="stylesheet" href="./desktop.css">
  <link rel="stylesheet" href="./learning/editorial.css">
  <link rel="stylesheet" href="./learning/workspace.css">
  <link rel="stylesheet" href="./learning/overview.css">
</head>
<body>
<header class="topbar">
  <div class="shell topbar-in">
    <div class="topbar-left">
      <button type="button" class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="切换目录导航">
        <span>☰</span>
      </button>
      <a class="brand mobile-brand" href="#home" data-action="nav-home" aria-label="AI 交互学习平台首页">
        <span class="brand-mark">✳</span>
        <span><strong>AI 学习工作台</strong></span>
      </a>
    </div>
    <div class="top-right">
      <span class="header-pill" id="headerProgress">练习达标 0 / 6 章</span>
      <button type="button" class="header-feedback-btn" data-action="nav-feedback" title="意见与反馈">
        <span>✉ 反馈</span>
      </button>
    </div>
  </div>
</header>

<div class="subnav-container" id="subNavBar" style="display:none;">
  <div class="shell subnav-in" id="subNavBarInner"></div>
</div>

<div class="mobile-subbar" id="mobileSubbar">
  <button type="button" class="drawer-toggle-btn" id="mobileDrawerToggle">
    <span>☰</span> <span id="mobileCurrentTitle">学习导航与目录</span>
  </button>
  <span class="micro" id="mobileCurrentMeta"></span>
</div>

<div class="sidebar-backdrop" id="sidebarBackdrop"></div>

<div class="layout">
  <aside class="sidebar" id="mainSidebar" aria-label="学习导航与目录">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <a class="brand" href="#home" data-action="nav-home" aria-label="AI 交互学习平台首页">
          <span class="brand-mark">✳</span>
          <div class="brand-text">
            <strong>AI 学习工作台</strong>
            <small>AI LEARNING LAB</small>
          </div>
        </a>
      </div>

      <nav class="main-nav" aria-label="全站主要模块">
        <button type="button" class="nav-item active" data-action="nav-home" data-main-nav="home">⌂ 学习首页</button>
        <button type="button" class="nav-item" data-action="nav-pathways" data-main-nav="pathways">▤ 基础学习</button>
        <button type="button" class="nav-item" data-action="nav-projects" data-main-nav="projects">◇ 实战项目</button>
        <button type="button" class="nav-item" data-action="nav-practice" data-main-nav="practice">↻ 练习复习</button>
        <button type="button" class="nav-item" data-action="nav-portfolio" data-main-nav="portfolio">▧ 我的成果</button>
      </nav>
    </div>

    <div class="side-panel" id="sidePanelContent"></div>

    <div class="side-global-footer">
      <button type="button" class="header-feedback-btn" data-action="nav-feedback" title="意见与反馈">
        <span>✉ 意见反馈</span>
      </button>
      <div class="side-storage-note">◎ 记录仅保存在本机</div>
    </div>
  </aside>

  <main class="content" id="mainContent">
    <div id="homeHeroArea">
      <div class="home-head">
        <div class="home-title-row">
          <div>
            <h1 class="home-heading">AI 交互学习工作台</h1>
            <p class="home-subheading">系统掌握人工智能原理与工程实践 · 概念、教材、项目与间隔复习</p>
          </div>
          <div class="home-stats-chips">
            <span class="home-chip"><strong id="conceptTotal">30</strong> 基础概念</span>
            <span class="home-chip"><strong id="questionTotal">144</strong> 练习题</span>
            <span class="home-chip">${learningLessons.length} 篇深度教材</span>
            <span class="home-chip">4 个实战项目</span>
          </div>
        </div>
        <div class="home-progress-compact" aria-label="课程完成进度">
          <div class="home-prog-info">
            <span class="home-prog-label">基础达标</span>
            <strong id="progressText">练习达标 0 / 6 章</strong>
          </div>
          <div class="home-prog-bar" role="progressbar" aria-label="掌握章节比例" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="progressBar">
            <span id="progressFill" style="width:0%"></span>
          </div>
          <div class="home-prog-pct" id="progressPct">0%</div>
        </div>
      </div>
    </div>

    <!-- Legacy compat nav: sr-only hidden, functional via JS delegation -->
    <nav id="dailyNav" class="daily-nav" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">
      <button type="button" data-action="nav-home">⌂</button>
      <button type="button" data-action="nav-review">🧠</button>
      <button type="button" data-action="nav-lab">🔬</button>
      <button type="button" data-action="nav-mission">🏅</button>
      <button type="button" data-action="nav-textbook">📚</button>
      <button type="button" data-action="nav-projects">🛠️</button>
      <button type="button" data-action="nav-training">🗓️</button>
      <button type="button" data-action="nav-feedback">✉</button>
    </nav>

    <div id="dynamicArea" aria-live="polite"></div>
    <p class="footnote">本课程用于基础知识训练与技术原理实践，不替代官方职业资格考试大纲或专业认证教材。</p>
  </main>
</div>

<script src="./feedback/feedback.js"></script>
<script src="./content/reader.js"></script>
<script src="./content/home.js"></script>
<script src="./projects/logic.js"></script>
<script src="./projects/guides.js"></script>
<script src="./projects/app.js"></script>
<script src="./training/training-data.js"></script>
<script src="./training/training-ui.js"></script>
<script src="./learning/content.js"></script>
<script src="./learning/catalog.js"></script>
<script src="./learning/core.js"></script>
<script src="./learning/workspace.js"></script>
<script src="./learning/overview.js"></script>
<script src="./learning/home.js"></script>
<script>
'use strict';
/* Training module loads before the existing app. */
`;

const part3 = `
// 透明的 V1.2 简化复习间隔，不宣称为 FSRS。
const REVIEW_INTERVALS={again:10/1440,hard:1,good:3,easy:7};
function cardId(ch,i){return \`c\${ch}-k\${i}\`}
function decodeCardId(id){const m=/^c([0-5])-k(\\d+)$/.exec(id);if(!m)return null;const ch=Number(m[1]),i=Number(m[2]);return COURSES[ch]?.concepts[i]?{ch,i}:null}
function dueIds(){const now=Date.now();return Object.keys(saved.reviewCards||{}).filter(id=>decodeCardId(id)&&Number(saved.reviewCards[id].due)<=now).sort((a,b)=>saved.reviewCards[a].due-saved.reviewCards[b].due)}
function gradeReviewCard(id,grade){
  const old=saved.reviewCards[id]||{intervalDays:0,successes:0,attempts:0};
  let intervalDays=REVIEW_INTERVALS[grade];
  if(old.intervalDays>0 && grade!=='again'){
    const factor={hard:1.25,good:2.2,easy:3}[grade];
    intervalDays=Math.max(REVIEW_INTERVALS[grade],Math.round(old.intervalDays*factor));
  }
  saved.reviewCards[id]={intervalDays,successes:(old.successes||0)+(grade==='again'?0:1),attempts:(old.attempts||0)+1,due:Date.now()+intervalDays*86400000,lastGrade:grade,lastReviewed:Date.now()};
  persist();
}
function whenDue(time){const diff=Number(time)-Date.now();if(diff<=0)return '现在到期';if(diff<3600000)return \`\${Math.ceil(diff/60000)} 分钟后\`;if(diff<86400000)return \`\${Math.ceil(diff/3600000)} 小时后\`;return \`\${Math.ceil(diff/86400000)} 天后\`}
function initReview(){ui.reviewItems=dueIds();ui.reviewIndex=0;ui.reviewRevealed=false;ui.tab='review';updateHashRoute();render()}

function homeMeta(){
  const hasLegacyProgress=[saved.mastered,saved.known,saved.best,saved.questionStats,saved.reviewCards,saved.missions].some(v=>Object.keys(v||{}).length>0)
    ||Object.keys(Textbook.getState()).length>0
    ||Object.values(trSaved).some(v=>Object.keys(v||{}).length>0)
    ||Object.values(ProjectLab.getProgress()).some(Boolean);
  return {lessons:HOME_LESSONS.length,questions:ALL_QUESTIONS.size,projects:4,sessions:32,hasLegacyProgress};
}
function renderHome(){return LearningHome.render(homeMeta())}

function renderActiveRecall(ch,i,isReview){
  const c=COURSES[ch],item=c.concepts[i],revealed=isReview?ui.reviewRevealed:ui.flipped;
  const id=cardId(ch,i),entry=saved.reviewCards[id];
  return \`<div class="flash-layout"><div class="flash-top"><span>\${isReview?'今日到期复习':'主动回忆 · 请先用自己的话解释这个术语'}</span><span>\${isReview?\`\${ui.reviewIndex+1} / \${ui.reviewItems.length}\`:\`\${i+1} / \${c.concepts.length}\`}</span></div>
  <button type="button" class="recall-card \${revealed?'revealed':''}" data-action="\${isReview?'review-flip':'flip'}" aria-label="\${revealed?'再次显示术语':'揭示术语答案'}"><span class="recall-eyebrow">\${revealed?'解释与核对':'先想一想，不要急着翻'}</span><span class="recall-text">\${esc(revealed?item[1]:item[0])}</span><span class="recall-reminder">\${revealed?'点击可返回术语':'点击揭示解释'}</span></button>
  \${revealed?\`<div class="rating-grid"><button class="rating" data-action="review-grade" data-cardid="\${id}" data-grade="again">想不起来<small>10 分钟后</small></button><button class="rating" data-action="review-grade" data-cardid="\${id}" data-grade="hard">比较吃力<small>至少 1 天后</small></button><button class="rating" data-action="review-grade" data-cardid="\${id}" data-grade="good">基本记得<small>至少 3 天后</small></button><button class="rating" data-action="review-grade" data-cardid="\${id}" data-grade="easy">非常熟悉<small>至少 7 天后</small></button></div>\`:\`<p class="recall-note">记忆训练不是阅读次数统计。先尝试回忆，再翻卡判断自己实际记得多少。</p>\`}
  \${entry?\`<p class="recall-note">复习次数：\${entry.attempts||0} · 当前下次复习：\${whenDue(entry.due)}</p>\`:''}
  \${isReview?\`<div class="footer-actions"><span class="micro">只展示已经建立复习计划且到期的卡片</span>\${actionBtn('review-exit','结束本轮',true)}</div>\`:\`<div class="flash-controls">\${actionBtn('flash-prev','← 上一张',true,i===0?'disabled':'')}\${actionBtn('flash-next','下一张 →',false,i===c.concepts.length-1?'disabled':'')}</div><p class="known-count">本章已有 \${c.concepts.filter((_,idx)=>!!saved.reviewCards[cardId(ch,idx)]).length}/\${c.concepts.length} 张卡片加入复习计划</p><div class="footer-actions"><span class="micro">提示：空格翻卡，方向键切换卡片</span>\${actionBtn('to-quiz','去做章节练习 →',true)}</div>\`}
  </div>\`;
}
function renderReview(){
  if(!ui.reviewItems.length)return \`<div class="empty-memory"><div style="font-size:44px">🌿</div><h3>今天没有到期的记忆卡</h3><p>先去章节记忆卡，尝试回忆并自评，系统才会安排下一次复习。</p>\${actionBtn('review-to-flash','开始学习新卡 →')}</div>\`;
  if(ui.reviewIndex>=ui.reviewItems.length)return \`<div class="quest-end"><div class="quest-icon">🎉</div><h3>本轮复习完成</h3><p>完成 \${ui.reviewItems.length} 张到期卡片。下次复习时间已在本地更新。</p>\${actionBtn('review-home','返回学习首页 →')}</div>\`;
  const location=decodeCardId(ui.reviewItems[ui.reviewIndex]);if(!location)return \`<p>记忆卡数据无效，请重新打开复习。</p>\`;
  return renderActiveRecall(location.ch,location.i,true);
}
const LAB_DATA=[{score:95,fault:true},{score:82,fault:true},{score:74,fault:false},{score:68,fault:true},{score:53,fault:false},{score:44,fault:true},{score:31,fault:false},{score:20,fault:true}];
function renderLab(){
  const choose=\`<div class="lab-selector"><button type="button" data-action="lab-select" data-index="0" class="\${ui.labMode===0?'active':''}">实验 01 · 垃圾邮件分类阈值</button><button type="button" data-action="lab-select" data-index="1" class="\${ui.labMode===1?'active':''}">实验 02 · 数据划分与泄漏</button></div>\`;
  if(ui.labMode===0)return \`\${choose}<div class="lab-console"><div class="lab-top"><div><h3>🔍 调整 AI 垃圾邮件识别阈值</h3><p>绿色是正确检出，橙色是误报，红色是漏检。尝试改变阈值。</p></div><span class="status-pill">可操作实验</span></div><div class="lab-setting"><label for="labThreshold"><span>判断为垃圾邮件的最低分数</span><strong id="thresholdValue">\${ui.threshold}</strong></label><input id="labThreshold" type="range" min="20" max="95" step="1" value="\${ui.threshold}"></div><div class="lab-devices" id="labDevices"></div><div class="lab-metrics"><div class="lab-metric"><strong id="labPrecision">--</strong><span>精确率</span></div><div class="lab-metric"><strong id="labRecall">--</strong><span>召回率</span></div><div class="lab-metric"><strong id="labFP">--</strong><span>误报（FP）</span></div><div class="lab-metric"><strong id="labFN">--</strong><span>漏检（FN）</span></div></div><div class="lab-notice" id="labInterpretation"></div><p class="recall-note">8 封邮件为人为构造的教学样本；指标变化仅适用于这组样本，阈值提升不保证每个真实数据集都获得更高精确率。</p></div>\`;
  return \`\${choose}<div class="lab-console"><div class="lab-top"><div><h3>🧪 为模型划分 1,000 条文本样本</h3><p>改变训练集比例，观察验证和测试样本的规模。</p></div><span class="status-pill">可操作实验</span></div><div class="lab-setting"><label for="labTrainSplit"><span>训练集占比</span><strong id="splitValue">\${ui.split}%</strong></label><input id="labTrainSplit" type="range" min="50" max="90" step="5" value="\${ui.split}"></div><div class="train-segments" aria-label="训练/验证/测试集比例"><span class="split-train" id="splitTrain"></span><span class="split-valid" id="splitValid"></span><span class="split-test" id="splitTest"></span></div><div class="lab-metrics" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="lab-metric"><strong id="trainCount">--</strong><span>训练集</span></div><div class="lab-metric"><strong id="validCount">--</strong><span>验证集</span></div><div class="lab-metric"><strong id="testCount">--</strong><span>测试集</span></div></div><label class="lab-toggle"><input type="checkbox" id="leakToggle" \${ui.leak?'checked':''}> 错误地把活动结束后才知道的结果放入预测特征</label><div class="lab-notice" id="splitInterpretation"></div><p class="recall-note">这是数据划分和信息泄漏的概念演示，不会在浏览器中真实训练神经网络；示例使用随机划分前提，实际项目还需考虑时间顺序、同原文样本和类别比例。</p></div>\`;
}
function updateLabLive(){
  if(ui.tab!=='lab')return;
  if(ui.labMode===0){
    const threshold=ui.threshold;let tp=0,fp=0,fn=0;
    const devices=LAB_DATA.map((d,i)=>{const predicted=d.score>=threshold;let cls='';if(predicted&&d.fault){tp++;cls='positive'}else if(predicted&&!d.fault){fp++;cls='false-positive'}else if(!predicted&&d.fault){fn++;cls='false-negative'};return \`<div class="lab-device \${cls}"><b>\${d.score}</b><small>\${d.fault?'实际垃圾邮件':'实际正常邮件'}</small><small>\${predicted?'预测垃圾邮件':'预测正常邮件'}</small></div>\`});
    $('thresholdValue').textContent=threshold;$('labDevices').innerHTML=devices.join('');
    $('labPrecision').textContent=tp+fp?\`\${Math.round(tp/(tp+fp)*100)}%\`:'未定义';
    $('labRecall').textContent=\`\${Math.round(tp/(tp+fn)*100)}%\`;
    $('labFP').textContent=fp;$('labFN').textContent=fn;
    $('labInterpretation').textContent=\`现在检出 \${tp} 封实际垃圾邮件、漏检 \${fn} 封、误报 \${fp} 封。阈值改变了模型作出“垃圾邮件”判断的数量。\`;
  }else{
    const train=ui.split,valid=Math.floor((100-train)/2),test=100-train-valid;
    $('splitValue').textContent=\`\${train}%\`;
    for(const [name,n] of [['Train',train],['Valid',valid],['Test',test]]){const el=$('split'+name);el.style.width=\`\${n}%\`;el.textContent=\`\${n}%\`;}
    $('trainCount').textContent=train*10;$('validCount').textContent=valid*10;$('testCount').textContent=test*10;
    $('splitInterpretation').textContent=ui.leak?'⚠️ 数据泄漏：模型在真实预测时无法提前获得未来结果，这会让离线评估不可信。应移除泄漏特征，并重新进行严格评估。':'✅ 未主动引入未来结果。训练集学习参数，验证集用于选择模型，测试集用于最终独立评估。仅合理划分还不能保证绝无其他泄漏。';
  }
}
function renderMission(){
  const m=MISSIONS[ui.chapter],step=m.steps[ui.missionStep];
  if(ui.missionStep>=m.steps.length)return \`<div class="quest-end"><div class="quest-icon">🏅</div><h3>恭喜完成本章情境闯关</h3><p>你已顺利处理「\${esc(m.name)}」的全部决策。已在本地记入闯关记录。</p><div class="result-actions">\${ui.chapter<5?actionBtn('mission-next','挑战下一章情境 →'):''}\${actionBtn('mission-repeat','再次挑战本章',true)}</div></div>\`;
  const dots=m.steps.map((_,idx)=>\`<span class="quest-dot \${idx<ui.missionStep?'done':idx===ui.missionStep?'active':''}"></span>\`).join('');
  const chosen=ui.missionChoice!==null;
  const isOk=chosen&&ui.missionChoice===step.ok;
  return \`<div class="quest-step"><div class="quest-dots">\${dots}</div><span class="quest-stage">STAGE \${ui.missionStep+1} / \${m.steps.length} · \${esc(m.name)}</span><h3>\${esc(step.q)}</h3><div class="quest-choices">\${step.a.map((ans,idx)=>\`<button type="button" class="quest-choice \${ui.missionChoice===idx?'selected':''}" data-action="mission-choice" data-index="\${idx}" \${chosen?'disabled':''}>\${String.fromCharCode(65+idx)}. \${esc(ans)}</button>\`).join('')}</div>\${chosen?\`<div class="quest-feedback \${isOk?'good':'bad'}"><strong>\${isOk?'✓ 决策合理':'✕ 存在隐患'}</strong><p>\${esc(isOk?step.good:step.bad)}</p></div><div class="footer-actions">\${isOk?actionBtn('mission-advance','进入下一阶段 →'):actionBtn('mission-retry','重新思考此步',true)}</div>\`:''}</div>\`;
}

const STORAGE_KEY='ai_foundations_learning_v1';
const savedDefaults=()=>({mastered:{},known:{},best:{},bestPct:{},questionStats:{},reviewCards:{},missions:{}});
let saved=savedDefaults();
try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw){
    const parsed=JSON.parse(raw);
    if(parsed&&typeof parsed==='object'){
      saved={...savedDefaults(),...parsed,mastered:parsed.mastered||{},known:parsed.known||{},best:parsed.best||{},bestPct:parsed.bestPct||{},questionStats:parsed.questionStats||{},reviewCards:parsed.reviewCards||{},missions:parsed.missions||{}};
    }
  }
}catch(e){console.warn('读取既有进度失败',e);}
const ALL_QUESTIONS=new Map();
COURSES.forEach((c,ch)=>{
  c.quiz.forEach((q,qi)=>{q.id=\`c\${ch}-q\${qi}\`;q.chapter=ch;q.subIndex=qi;ALL_QUESTIONS.set(q.id,q);});
});

let ui={
  chapter:0,tab:'home',lessonId:'reliable-ai',lessonView:'reading',opened:0,flashIndex:0,flipped:false,
  qIndex:0,answers:[],checked:false,finished:false,quizItems:[],quizMode:'chapter10',
  reviewItems:[],reviewIndex:0,reviewRevealed:false,labMode:0,threshold:60,split:70,leak:false,missionStep:0,missionChoice:null
};

const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){console.warn('学习记录保存失败',e);}}
function totalConcepts(){return COURSES.reduce((n,c)=>n+c.concepts.length,0)}
function score(){return COURSES.reduce((n,_,i)=>n+(saved.mastered[i]?1:0),0)}
function activeWrongIds(){return [...ALL_QUESTIONS.keys()].filter(id=>saved.questionStats[id]?.needsReview)}
function everWrongIds(){return [...ALL_QUESTIONS.keys()].filter(id=>saved.questionStats[id]?.wrong>0)}
function actionBtn(action,label,secondary=false,extra=''){return \`<button type="button" class="btn \${secondary?'btn-secondary':''}" data-action="\${action}" \${extra}>\${label}</button>\`}

function resetChapter(i,tab='learn'){
  ui={...ui,chapter:i,tab,opened:0,flashIndex:0,flipped:false,qIndex:0,answers:[],checked:false,finished:false,quizItems:[],quizMode:'chapter10',missionStep:0,missionChoice:null};
  updateHashRoute();
  render();
  const rect=$('dynamicArea').getBoundingClientRect();
  window.scrollTo({top:Math.max(0,rect.top+window.scrollY-28),behavior:'smooth'});
}

function changeTab(tab){
  if(tab==='review'){initReview();return;}
  ui.tab=tab;
  if(tab==='flash')ui.flipped=false;
  if(tab==='mission'){ui.missionStep=0;ui.missionChoice=null;}
  updateHashRoute();
  render();
}

function shuffle(items){const arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

function startQuiz(mode,ids){
  ui.quizMode=mode;
  if(Array.isArray(ids)){ui.quizItems=ids.filter(id=>ALL_QUESTIONS.has(id));}
  else if(mode==='wrong'){
    const pending=activeWrongIds();
    ui.quizItems=pending.sort((a,b)=>(saved.questionStats[a]?.lastAttempt||0)-(saved.questionStats[b]?.lastAttempt||0)).slice(0,20);
  }else{
    const available=COURSES[ui.chapter].quiz.map(q=>q.id);
    ui.quizItems=shuffle(available).slice(0,mode==='chapter20'?available.length:10);
  }
  if(!ui.quizItems.length){ui.tab='wrong';render();return;}
  ui.qIndex=0;ui.answers=[];ui.checked=false;ui.finished=false;ui.tab='quiz';
  updateHashRoute();
  render();
}

function recordAttempt(question,answer){
  const old=saved.questionStats[question.id]||{attempts:0,correct:0,wrong:0,needsReview:false};
  old.attempts=(Number(old.attempts)||0)+1;
  if(answer===question.a){old.correct=(Number(old.correct)||0)+1;old.needsReview=false;}
  else{old.wrong=(Number(old.wrong)||0)+1;old.needsReview=true;old.lastWrong=Date.now();}
  old.lastAttempt=Date.now();
  saved.questionStats[question.id]=old;
  persist();
}
function currentScore(){return ui.quizItems.reduce((n,id,i)=>n+(ui.answers[i]===ALL_QUESTIONS.get(id).a?1:0),0)}
function finishQuiz(){
  ui.finished=true;
  const n=currentScore(),total=ui.quizItems.length;
  if(ui.quizMode!=='wrong'){
    const pct=Math.round(100*n/total),old=Number(saved.bestPct[ui.chapter]||0);
    saved.bestPct[ui.chapter]=Math.max(old,pct);
    if(pct>=70) saved.mastered[ui.chapter]=true;
    persist();
  }
  render();
}

/* Primary Section / Nav mapping */
function currentMainNav(){
  if(ui.tab==='home')return 'home';
  if(['pathways','lesson','learn','flash','quiz','textbook','training'].includes(ui.tab))return 'pathways';
  if(ui.tab==='portfolio')return 'portfolio';
  if(ui.tab==='projects')return 'projects';
  if(['review','lab','mission','wrong'].includes(ui.tab))return 'practice';
  if(ui.tab==='feedback')return 'feedback';
  return 'home';
}

/* URL Hash Route Synchronization */
function updateHashRoute(){
  let hash='#home';
  if(ui.tab==='home')hash='#home';
  else if(ui.tab==='pathways')hash='#pathways';
  else if(ui.tab==='lesson')hash='#lesson?id='+encodeURIComponent(ui.lessonId)+(ui.lessonView==='practice'?'&view=practice':'');
  else if(ui.tab==='portfolio')hash='#my-learning';
  else if(ui.tab==='textbook'){
    const active=(typeof Textbook!=='undefined'&&Textbook.getActive)?Textbook.getActive():null;
    hash=active?\`#courses?mode=textbook&lesson=\${active}\`:'#courses?mode=textbook';
  }else if(ui.tab==='training'){
    const day=(typeof trState!=='undefined')?trState.day:1;
    hash=\`#courses?mode=training&day=\${day}\`;
  }else if(ui.tab==='projects'){
    const pSel=(typeof ProjectLab!=='undefined'&&ProjectLab.getSelected)?ProjectLab.getSelected():null;
    hash=pSel?\`#projects?id=\${pSel}\`:'#projects';
  }else if(['learn','flash','quiz'].includes(ui.tab)){
    hash=\`#courses?mode=foundations&ch=\${ui.chapter}&tab=\${ui.tab}\`;
  }else if(ui.tab==='review'){
    hash='#practice?mode=review';
  }else if(ui.tab==='lab'){
    hash=\`#practice?mode=lab&id=\${ui.labMode}\`;
  }else if(ui.tab==='mission'){
    hash=\`#practice?mode=mission&ch=\${ui.chapter}\`;
  }else if(ui.tab==='wrong'){
    hash='#practice?mode=wrong';
  }else if(ui.tab==='feedback'){
    hash='#feedback';
  }
  if(window.location.hash.replace(/&anchor=[^&]*/g,'')===hash)hash=window.location.hash;
  if(window.location.hash!==hash){
    history.replaceState(null,'',hash);
  }
}

function syncRouteFromHash(){
  const hash=window.location.hash.replace(/^#\\/?/,'');
  if(!hash||hash==='home'){
    if(ui.tab!=='home'){ui.tab='home';render();}
    return;
  }
  const [route,queryStr]=hash.split('?');
  const params=new URLSearchParams(queryStr||'');

  if(route==='pathways'||route==='lesson'||route==='my-learning'){
    ui.tab=route==='my-learning'?'portfolio':route;
    if(route==='lesson'){ui.lessonId=params.get('id')||'reliable-ai';ui.lessonView=params.get('view')==='practice'?'practice':'reading';}
    render();
  }else if(route==='courses'||route==='foundations'){
    const mode=params.get('mode')||(route==='foundations'?'foundations':'foundations');
    if(mode==='textbook'){
      ui.tab='textbook';
      const lesson=params.get('lesson');
      render();
      if(lesson&&typeof Textbook!=='undefined'&&Textbook.navigate){Textbook.navigate(lesson).then(restoreRouteAnchor);}
    }else if(mode==='training'){
      ui.tab='training';
      const day=parseInt(params.get('day'),10);
      if(!isNaN(day)&&day>=1&&day<=16&&typeof trState!=='undefined')trState.day=day;
      render();
    }else{
      const ch=parseInt(params.get('ch')||params.get('chapter'),10);
      if(!isNaN(ch)&&ch>=0&&ch<COURSES.length)ui.chapter=ch;
      ui.tab=params.get('tab')||'learn';
      render();
    }
  }else if(route==='textbook'){
    ui.tab='textbook';
    const lesson=params.get('lesson');
    render();
    if(lesson&&typeof Textbook!=='undefined'&&Textbook.navigate){Textbook.navigate(lesson).then(restoreRouteAnchor);}
  }else if(route==='training'){
    ui.tab='training';
    const day=parseInt(params.get('day'),10);
    if(!isNaN(day)&&day>=1&&day<=16&&typeof trState!=='undefined')trState.day=day;
    render();
  }else if(route==='projects'){
    ui.tab='projects';
    const id=params.get('id');
    render();
    if(id&&typeof ProjectLab!=='undefined'&&ProjectLab.go){ProjectLab.go(id);}
  }else if(route==='practice'){
    const mode=params.get('mode')||'review';
    if(mode==='review')initReview();
    else if(mode==='lab'){ui.tab='lab';const id=parseInt(params.get('id'),10);if(id===1)ui.labMode=1;render();}
    else if(mode==='mission'){ui.tab='mission';const ch=parseInt(params.get('ch'),10);if(!isNaN(ch)&&ch>=0&&ch<6)ui.chapter=ch;render();}
    else if(mode==='wrong'){ui.tab='wrong';render();}
  }else if(route==='review'){
    initReview();
  }else if(route==='lab'){
    ui.tab='lab';render();
  }else if(route==='mission'){
    ui.tab='mission';render();
  }else if(route==='wrong'){
    ui.tab='wrong';render();
  }else if(route==='feedback'){
    ui.tab='feedback';render();
  }
  restoreRouteAnchor();
}

function restoreRouteAnchor(){
  const query=window.location.hash.split('?')[1]||'';
  const id=new URLSearchParams(query).get('anchor');
  if(id)requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'}));
}

/* Dynamic Subnav Bar update (hidden on quiet layout, but kept functional) */
function updateSubNav(){
  const nav=currentMainNav(),box=$('subNavBar'),inner=$('subNavBarInner');
  if(!box||!inner)return;
  box.style.display='none';
}

function learningSideLink(href,label,mark,description='',current=false){
  return '<a class="chapter-button learning-nav-item'+(current?' active':'')+'" data-learning-nav href="'+esc(href)+'"'+(current?' aria-current="page"':'')+'><span class="chapter-no" aria-hidden="true">'+esc(mark)+'</span><span class="chapter-meta"><strong>'+esc(label)+'</strong>'+(description?'<small>'+esc(description)+'</small>':'')+'</span></a>';
}
function learningSideGroup(title,links){
  return '<section class="learning-side-group"><h2 class="side-overline learning-side-heading">'+esc(title)+'</h2><nav class="chapter-nav" aria-label="'+esc(title)+'">'+links+'</nav></section>';
}
function learningSidebar(){
  const isOverview=ui.tab==='pathways';
  const isOutline=isOverview&&new URLSearchParams(window.location.hash.split('?')[1]||'').get('anchor')==='training-overview';
  const courses=LearningCatalog.list().map((course,index)=>{
    const [title,...description]=course.title.split('：');
    return learningSideLink('#lesson?id='+encodeURIComponent(course.id),title,String(index+1).padStart(2,'0'),description.join('：'),ui.tab==='lesson'&&ui.lessonId===course.id);
  }).join('');
  return '<div class="learning-side-catalog">'+
    learningSideGroup('学习安排',learningSideLink('#pathways','课程说明','概','学习顺序与内容',isOverview&&!isOutline)+learningSideLink('#pathways?anchor=training-overview','16天培训大纲','16','每日主题与任务',isOutline))+
    learningSideGroup('入门资料',courses)+
    learningSideGroup('继续深入',learningSideLink('#courses?mode=foundations&ch=0&tab=learn','六章系统基础','基')+learningSideLink('#courses?mode=textbook','专题教材','读'))+
    '<p class="learning-side-note">先读资料与示范，再进入练习。</p></div>';
}
/* Context-Aware Main Sidebar */
function updateMainSidebar(){
  const panel=$('sidePanelContent');
  if(!panel)return;
  const mastered=score(),wrong=activeWrongIds().length,due=dueIds().length;

  if(['lesson','portfolio','pathways'].includes(ui.tab)){
    panel.innerHTML=learningSidebar();
  }else if(['learn','flash','quiz'].includes(ui.tab)){
    panel.innerHTML=\`
      <div class="side-overline">课程通道</div>
      <div class="side-track-switcher">
        <button type="button" class="side-track-pill active" data-action="nav-foundations">基础六章</button>
        <button type="button" class="side-track-pill" data-action="nav-textbook">系统教材</button>
        <button type="button" class="side-track-pill" data-action="nav-training">16天培训</button>
      </div>
      <div class="side-overline">基础六章目录</div>
      <nav class="chapter-nav" id="chapterNav">
        \${COURSES.map((c,i)=>\`
          <button type="button" class="chapter-button \${i===ui.chapter?'active':''} \${saved.mastered[i]?'passed':''}" data-action="chapter" data-index="\${i}">
            <span class="chapter-no">\${saved.mastered[i]?'✓':String(i+1).padStart(2,'0')}</span>
            <span class="chapter-meta">
              <strong>\${esc(c.title)}</strong>
              <small>\${saved.mastered[i]?'✓ 达标':'◷ 待达标'} · \${esc(c.subtitle)}</small>
            </span>
          </button>
        \`).join('')}
      </nav>
      <div class="side-sub-footer">
        <button type="button" class="side-link-btn" data-action="show-wrong">📝 错题本 (\${wrong} 题)</button>
        <button type="button" data-action="clear">重置基础六章记录</button>
      </div>\`;
  }else if(ui.tab==='textbook'){
    const manifest=(typeof Textbook!=='undefined'&&Textbook.getManifest)?Textbook.getManifest():null;
    const activeLesson=(typeof Textbook!=='undefined'&&Textbook.getActive)?Textbook.getActive():null;
    const itemState=(typeof Textbook!=='undefined'&&Textbook.itemState)?Textbook.itemState:(()=>({}));
    const finished=manifest?manifest.lessons.filter(l=>itemState(l.id).completed).length:0;
    const groups=manifest?[...new Set(manifest.lessons.map(l=>l.group))]:[];

    panel.innerHTML=\`
      <div class="side-overline">课程通道</div>
      <div class="side-track-switcher">
        <button type="button" class="side-track-pill" data-action="nav-foundations">基础六章</button>
        <button type="button" class="side-track-pill active" data-action="nav-textbook">系统教材</button>
        <button type="button" class="side-track-pill" data-action="nav-training">16天培训</button>
      </div>
      <div class="side-overline">系统教材 (\${finished}/\${HOME_LESSONS.length})</div>
      <div class="book-sidebar-progress"><span style="width:\${finished/HOME_LESSONS.length*100}%"></span></div>
      <button type="button" class="chapter-button \${activeLesson===null?'active':''}" data-book-open="">
        <span class="chapter-no">⌂</span>
        <span class="chapter-meta"><strong>教材概览</strong><small>\${HOME_LESSONS.length} 篇 · 基础与工程进阶</small></span>
      </button>
      <nav class="chapter-nav">
        \${groups.map(g=>\`
          <div class="side-group-title">\${esc(g)}</div>
          \${manifest.lessons.filter(l=>l.group===g).map((l)=>\`
            <button type="button" class="chapter-button \${activeLesson===l.id?'active':''}" data-book-open="\${esc(l.id)}">
              <span class="chapter-no">\${itemState(l.id).completed?'✓':manifest.lessons.indexOf(l)+1}</span>
              <span class="chapter-meta">
                <strong>\${esc(l.title)}</strong>
                <small>\${l.mins} 分钟 · \${itemState(l.id).completed?'已完成':itemState(l.id).opened?'阅读中':'未开始'}</small>
              </span>
            </button>
          \`).join('')}
        \`).join('')}
      </nav>\`;
  }else if(ui.tab==='training'){
    const halfCount=Object.values(trSaved.completed||{}).filter(Boolean).length;
    const passDays=TRAINING_PLAN.filter(x=>Number(trSaved.best[x.day]||0)>=3).length;
    panel.innerHTML=\`
      <div class="side-overline">课程通道</div>
      <div class="side-track-switcher">
        <button type="button" class="side-track-pill" data-action="nav-foundations">基础六章</button>
        <button type="button" class="side-track-pill" data-action="nav-textbook">系统教材</button>
        <button type="button" class="side-track-pill active" data-action="nav-training">16天培训</button>
      </div>
      <div class="side-overline">16 天集训大纲</div>
      <div class="side-overline" style="font-size:11px;color:var(--ink-secondary);letter-spacing:0">已确认 \${halfCount}/32 时段 · \${passDays}/16 天达标</div>
      <nav class="chapter-nav">
        \${TRAINING_PLAN.map(x=>\`
          <button type="button" class="chapter-button \${trState.day===x.day?'active':''}" data-action="tr-day" data-day="\${x.day}">
            <span class="chapter-no">\${trCompleted(x.day)?'✓':String(x.day).padStart(2,'0')}</span>
            <span class="chapter-meta">
              <strong>第 \${x.day} 天实操</strong>
              <small>\${esc((x.sessions[0]?.topic||x.title||'').slice(0,14))}</small>
            </span>
          </button>
        \`).join('')}
      </nav>
      <div class="side-sub-footer">
        <button type="button" class="side-link-btn" data-action="tr-wrong">📝 培训错题复练 (\${trPending().length})</button>
      </div>\`;
  }else if(ui.tab==='projects'){
    const projects=(typeof ProjectLab!=='undefined'&&ProjectLab.getProjects)?ProjectLab.getProjects():[];
    const selected=(typeof ProjectLab!=='undefined'&&ProjectLab.getSelected)?ProjectLab.getSelected():null;
    const flags=(typeof ProjectLab!=='undefined'&&ProjectLab.getProgress)?ProjectLab.getProgress():{};
    panel.innerHTML=\`
      <div class="side-overline">实战项目</div>
      <button type="button" class="chapter-button \${selected===null?'active':''}" data-project="back">
        <span class="chapter-no">⌂</span>
        <span class="chapter-meta"><strong>实战项目中心</strong><small>可验证的实践交付</small></span>
      </button>
      <nav class="chapter-nav">
        \${projects.map((p,i)=>\`
          <button type="button" class="chapter-button \${selected===p.id?'active':''}" data-project="open" data-id="\${p.id}">
            <span class="chapter-no">\${flags[p.id]?'✓':p.icon}</span>
            <span class="chapter-meta">
              <strong>\${p.title}</strong>
              <small>\${p.level}</small>
            </span>
          </button>
        \`).join('')}
      </nav>
      <div class="side-sub-footer">
        <button type="button" class="side-link-btn" data-project="export-all">导出成果 JSON</button>
      </div>\`;
  }else if(['review','lab','mission','wrong'].includes(ui.tab)){
    panel.innerHTML=\`
      <div class="side-overline">练习与复习</div>
      <nav class="chapter-nav">
        <button type="button" class="chapter-button \${ui.tab==='review'?'active':''}" data-action="nav-review">
          <span class="chapter-no">🧠</span>
          <span class="chapter-meta"><strong>今日到期复习</strong><small>\${due} 张到期记忆卡</small></span>
        </button>
        <button type="button" class="chapter-button \${ui.tab==='lab'?'active':''}" data-action="nav-lab">
          <span class="chapter-no">🔬</span>
          <span class="chapter-meta"><strong>互动实验</strong><small>阈值设定与数据划分</small></span>
        </button>
        <button type="button" class="chapter-button \${ui.tab==='mission'?'active':''}" data-action="nav-mission">
          <span class="chapter-no">🏅</span>
          <span class="chapter-meta"><strong>情境闯关</strong><small>6 大情境挑战任务</small></span>
        </button>
        <button type="button" class="chapter-button \${ui.tab==='wrong'?'active':''}" data-action="nav-wrong">
          <span class="chapter-no">📝</span>
          <span class="chapter-meta"><strong>错题本</strong><small>\${wrong} 道待巩固错题</small></span>
        </button>
      </nav>\`;
  }else{
    // Home or Feedback
    if(ui.tab==='home'&&!LearningWorkspace.summary().started&&!homeMeta().hasLegacyProgress){
      panel.innerHTML='<div class="learning-side-catalog">'+learningSideGroup('建议学习顺序',learningSideLink('#pathways','了解课程安排','1','先看说明与16天大纲')+learningSideLink('#lesson?id=ai-basics','阅读第1课资料','2','从认识 AI 开始')+learningSideLink('#courses?mode=foundations&ch=0&tab=learn','深入系统基础','3','连接六章知识体系'))+'<p class="learning-side-note">先读资料与示范，再进入练习。</p></div>';
      return;
    }
    const tbDone=HOME_LESSONS.filter(l=>Textbook.getState()[l.id]?.completed).length;
    const projDone=(typeof ProjectLab!=='undefined'&&ProjectLab.getProgress)?Object.values(ProjectLab.getProgress()).filter(Boolean).length:0;
    panel.innerHTML=\`
      <div class="side-overline">学习进度总览</div>
      <div class="side-home-stats">
        <div><span>基础六章</span><strong>\${mastered} / 6 达标</strong></div>
        <div><span>系统教材</span><strong>\${tbDone} / \${HOME_LESSONS.length} 篇已读</strong></div>
        <div><span>实战项目</span><strong>\${projDone} / 4 项达标</strong></div>
        <div><span>待复习卡</span><strong>\${due} 张到期</strong></div>
        <div><span>错题巩固</span><strong>\${wrong} 道待练</strong></div>
      </div>
      <div class="side-sub-footer">
        <button type="button" data-action="clear">重置基础学习记录</button>
      </div>\`;
  }
}

function updateMobileSubbar(){
  const barEl=$('mobileSubbar');
  if(!barEl)return;
  if(ui.tab==='home'){
    barEl.style.display='none';
    return;
  }
  barEl.style.display='flex';
  const titleEl=$('mobileCurrentTitle'),metaEl=$('mobileCurrentMeta');
  if(!titleEl)return;
  if(ui.tab==='home'){
    titleEl.textContent='学习首页';if(metaEl)metaEl.textContent='概览与推荐';
  }else if(ui.tab==='pathways'||ui.tab==='lesson'||ui.tab==='portfolio'){
    titleEl.textContent=ui.tab==='lesson'?(LearningCatalog.get(ui.lessonId)?.title||'课程不存在'):ui.tab==='portfolio'?'我的成果':'基础学习';
    if(metaEl)metaEl.textContent=ui.tab==='lesson'?(ui.lessonView==='practice'?'配套练习':'课程资料'):ui.tab==='portfolio'?'个人作品与备份':'课程与16天安排';
  }else if(ui.tab==='textbook'){
    const active=(typeof Textbook!=='undefined'&&Textbook.getActive)?Textbook.getActive():null;
    const manifest=(typeof Textbook!=='undefined'&&Textbook.getManifest)?Textbook.getManifest():null;
    const lesson=manifest?manifest.lessons.find(l=>l.id===active):null;
    titleEl.textContent=lesson?\`教材 · \${lesson.title}\`:'系统教材大纲';
    if(metaEl)metaEl.textContent=lesson?\`建议 \${lesson.mins} 分钟\`:HOME_LESSONS.length+' 篇';
  }else if(ui.tab==='training'){
    titleEl.textContent=\`16 天培训 · 第 \${trState.day} 天\`;
    if(metaEl)metaEl.textContent='实战大纲';
  }else if(ui.tab==='projects'){
    const sel=(typeof ProjectLab!=='undefined'&&ProjectLab.getSelected)?ProjectLab.getSelected():null;
    const projects=(typeof ProjectLab!=='undefined'&&ProjectLab.getProjects)?ProjectLab.getProjects():[];
    const p=projects.find(x=>x.id===sel);
    titleEl.textContent=p?\`实战 · \${p.title}\`:'4 大实战项目';
    if(metaEl)metaEl.textContent=p?p.level:'项目中心';
  }else if(['learn','flash','quiz'].includes(ui.tab)){
    titleEl.textContent=\`第 \${ui.chapter+1} 章：\${COURSES[ui.chapter].title}\`;
    if(metaEl)metaEl.textContent=ui.tab==='learn'?'章节课程':ui.tab==='flash'?'主动回忆':'章节测验';
  }else if(ui.tab==='review'){
    titleEl.textContent='今日到期复习';if(metaEl)metaEl.textContent=\`\${dueIds().length} 张卡片\`;
  }else if(ui.tab==='lab'){
    titleEl.textContent='互动实验';if(metaEl)metaEl.textContent=ui.labMode===0?'邮件阈值':'数据划分';
  }else if(ui.tab==='mission'){
    titleEl.textContent=\`情境闯关 · 第 \${ui.chapter+1} 章\`;if(metaEl)metaEl.textContent='业务决策';
  }else if(ui.tab==='wrong'){
    titleEl.textContent='错题本';if(metaEl)metaEl.textContent=\`\${activeWrongIds().length} 道错题\`;
  }else if(ui.tab==='feedback'){
    titleEl.textContent='反馈与建议';if(metaEl)metaEl.textContent='';
  }
}

let lastRenderedPage='';
function render(){
  const pageKey=ui.tab==='lesson'?'lesson:'+ui.lessonId+':'+ui.lessonView:ui.tab;
  const routeAnchor=new URLSearchParams(window.location.hash.split('?')[1]||'').get('anchor');
  if(['pathways','lesson','portfolio'].includes(ui.tab)&&pageKey!==lastRenderedPage&&!routeAnchor){
    requestAnimationFrame(()=>{if(lastRenderedPage===pageKey)window.scrollTo({top:0,left:0,behavior:'instant'});});
  }
  lastRenderedPage=pageKey;
  const isHome=ui.tab==='home';
  const heroBox=$('homeHeroArea');
  if(heroBox)heroBox.style.display='none';

  $('mainContent').classList.toggle('feedback-mode',ui.tab==='feedback');
  document.querySelectorAll('[data-action="nav-feedback"]').forEach(b=>b.classList.toggle('active',ui.tab==='feedback'));

  // Update primary navigation tabs in sidebar
  const mainNav=currentMainNav();
  document.querySelectorAll('.main-nav .nav-item').forEach(b=>{
    b.classList.toggle('active',b.dataset.mainNav===mainNav);
  });

  updateSubNav();
  updateMainSidebar();
  updateMobileSubbar();

  // Backward compatibility with legacy tests querying #dailyNav
  document.querySelectorAll('#dailyNav [data-action]').forEach(b=>{
    b.classList.toggle('active',({'nav-home':'home','nav-review':'review','nav-lab':'lab','nav-mission':'mission','nav-training':'training','nav-textbook':'textbook','nav-projects':'projects','nav-feedback':'feedback'})[b.dataset.action]===ui.tab);
  });

  const mastered=score(),pct=Math.round(100*mastered/COURSES.length),wrong=activeWrongIds().length,due=dueIds().length;
  if($('headerProgress'))$('headerProgress').textContent=\`练习达标 \${mastered} / 6 章\`;
  if($('conceptTotal'))$('conceptTotal').textContent=totalConcepts();
  if($('questionTotal'))$('questionTotal').textContent=ALL_QUESTIONS.size;
  if($('progressText'))$('progressText').textContent=mastered===6?'六章练习全部达标 · 可以继续挑战':\`练习达标 \${mastered} / 6 章 · 请结合实验与复习巩固\`;
  if($('progressPct'))$('progressPct').textContent=\`\${pct}%\`;
  if($('progressFill'))$('progressFill').style.width=\`\${pct}%\`;
  if($('progressBar'))$('progressBar').setAttribute('aria-valuenow',pct);

  if(ui.tab==='lesson'||ui.tab==='portfolio'){
    if(ui.tab==='lesson'&&!LearningCatalog.get(ui.lessonId)){
      const area=$('dynamicArea');
      area.classList.remove('learn-workspace');
      area.removeAttribute('data-workshop');area.removeAttribute('data-lesson-id');area.removeAttribute('data-lesson-view');
      area.oninput=null;area.onchange=null;area.onclick=null;
      area.innerHTML='<section class="learn-empty" data-lesson-error><h1>未找到这节课程</h1><p>请从学习路线选择现有课程。</p><a class="btn" href="#pathways">返回学习路线</a></section>';
      return;
    }
    LearningWorkspace.render($('dynamicArea'),ui.tab,ui.tab==='lesson'?ui.lessonId:'reliable-ai',ui.lessonView);
    return;
  }
  $('dynamicArea').classList.remove('learn-workspace');
  $('dynamicArea').removeAttribute('data-workshop');
  $('dynamicArea').removeAttribute('data-lesson-id');
  $('dynamicArea').removeAttribute('data-lesson-view');
  $('dynamicArea').oninput=null;
  $('dynamicArea').onchange=null;
  $('dynamicArea').onclick=null;
  if(ui.tab==='pathways'){
    $('dynamicArea').innerHTML=LearningOverview.render({trainingPlan:TRAINING_PLAN,foundationCourses:COURSES,textbookLessons:HOME_LESSONS,lessons:LearningCatalog.list()});
    return;
  }
  if(ui.tab==='projects'){
    ProjectLab.render();
    return;
  }
  if(ui.tab==='textbook'){
    Textbook.render();
    return;
  }
  if(ui.tab==='feedback'){
    Feedback.render();
    return;
  }

  const c=COURSES[ui.chapter];
  if(ui.tab==='home'){
    $('dynamicArea').innerHTML=renderHome();
    return;
  }

  // Foundations & Practice Views
  const isFoundations=['learn','flash','quiz'].includes(ui.tab);
  let tabs=[];
  if(isFoundations){
    tabs=[['learn','① 章节课程'],['flash','② 主动回忆'],['quiz','③ 章节测验']];
  }else{
    tabs=[['review',\`① 今日复习 (\${due})\`],['lab','② 互动实验'],['mission','③ 场景闯关'],['wrong',\`④ 错题本 (\${wrong})\`]];
  }

  let currentTitle='',currentDesc='',eyebrowText='';
  if(isFoundations){
    eyebrowText=\`CHAPTER \${String(ui.chapter+1).padStart(2,'0')} / 06 · \${esc(c.subtitle)}\`;
    currentTitle=esc(c.title);
    currentDesc=esc(c.goal);
  }else if(ui.tab==='training'){
    eyebrowText='TRAINING TRACK · 按实际培训大纲';
    currentTitle='16 天培训实战';
    currentDesc='课程、实操成果及配套练习按照提供的大纲安排；不取代既有六章基础课程。';
  }else if(ui.tab==='review'){
    eyebrowText='SPACED REPETITION · 间隔复习';
    currentTitle='今日到期概念卡';
    currentDesc='先在脑中尝试回忆，再揭示核对；根据回忆难度记录下一次复习时间。';
  }else if(ui.tab==='lab'){
    eyebrowText='INTERACTIVE LAB · 概念与边界';
    currentTitle='交互式基础实验';
    currentDesc='通过可操作滑块观察分类阈值与数据划分对准确率、召回率和泄漏风险的影响。';
  }else if(ui.tab==='mission'){
    eyebrowText=\`SCENARIO MISSION · 第 \${ui.chapter+1} 章\`;
    currentTitle=\`情境挑战：\${esc(MISSIONS[ui.chapter].name)}\`;
    currentDesc='置身实际业务情境做出关键决策，获得即时反馈并排查典型认知误区。';
  }else if(ui.tab==='wrong'){
    eyebrowText='NOTEBOOK · 错题巩固';
    currentTitle='错题智能复习';
    currentDesc='自动收集答错的题目，复习再次答对后将自动移出待复习列表。';
  }

  $('dynamicArea').innerHTML=\`
    <div class="section-header">
      <div>
        <div class="eyebrow">\${eyebrowText}</div>
        <h2>\${currentTitle}</h2>
        <p>\${currentDesc}</p>
      </div>
      <span class="status-pill \${isFoundations&&saved.mastered[ui.chapter]?'complete':''}">
        \${isFoundations?(saved.mastered[ui.chapter]?'✓ 本章练习达标':'◷ 课程进行中'):(ui.tab==='review'?\`\${due} 张到期\`:ui.tab==='wrong'?\`\${wrong} 道待复习\`:'可操作')}
      </span>
    </div>
    \${tabs.length?\`<div class="tabs" role="tablist" aria-label="学习方式">\${tabs.map(([key,label])=>\`<button type="button" role="tab" aria-selected="\${ui.tab===key}" class="tab \${ui.tab===key?'active':''}" data-action="tab" data-tab="\${key}">\${label}</button>\`).join('')}</div>\`:''}
    <section class="panel" role="tabpanel">
      \${ui.tab==='learn'?renderLearn(c):ui.tab==='flash'?renderFlash(c):ui.tab==='review'?renderReview():ui.tab==='wrong'?renderWrong():ui.tab==='lab'?renderLab():ui.tab==='mission'?renderMission():ui.tab==='training'?renderTraining():renderQuiz(c)}
    </section>\`;

  if(ui.tab==='lab')updateLabLive();
}

function renderLearn(c){
  const d=DEEP_DIVE[ui.chapter];
  const sections=d.sections.map((part,i)=>\`<details class="deep-card" \${i===0?'open':''}><summary><span class="deep-num">\${i+1}</span><strong>\${esc(part.title)}</strong><span class="deep-toggle">展开 / 收起</span></summary><div class="deep-detail"><p>\${esc(part.explain)}</p><div class="scenario"><strong>📌 通用案例</strong><p>\${esc(part.example)}</p></div><div class="pitfall"><strong>⚠️ 常见误区</strong><p>\${esc(part.pitfall)}</p></div></div></details>\`).join('');
  return \`<h3 class="panel-title">本章系统讲解</h3><p class="panel-sub">\${esc(d.intro)}</p><div class="deep-list">\${sections}</div><div class="section-divider"><strong>知识点速查</strong><span>读懂原理后，逐项核对概念</span></div><div class="concept-list">\${c.concepts.map(([term,desc],i)=>\`<div class="concept"><button type="button" aria-expanded="\${ui.opened===i}" class="concept-head" data-action="concept" data-index="\${i}"><span class="concept-index">\${String(i+1).padStart(2,'0')}</span><span class="concept-name">\${esc(term)}</span><span class="chevron">\${ui.opened===i?'⌃':'⌄'}</span></button>\${ui.opened===i?\`<div class="concept-body"><p>\${esc(desc)}</p></div>\`:''}</div>\`).join('')}</div><div class="insight"><i>💡</i><div><strong>综合应用案例</strong><p>\${esc(c.example)}</p></div></div><div class="footer-actions"><span class="micro">\${d.sections.length} 个专题讲解 · \${c.concepts.length} 个基础概念</span>\${actionBtn('to-flash','开始记忆训练 →')}</div>\`;
}
function renderFlash(c){return renderActiveRecall(ui.chapter,ui.flashIndex,false);}

function renderQuiz(c){
  if(!ui.quizItems.length) return \`<h3 class="panel-title">章节练习</h3><p class="panel-sub">本章共有 \${c.quiz.length} 道单项选择题。答题后即时查看解析；答错的题目自动加入错题本。一次章节练习达 70% 即达标，旧版已达标的章节会保留。</p><div class="mode-grid"><div class="mode-card"><h3>随机练习 · 10 题</h3><p>从本章题库随机抽取，适合日常巩固。</p>\${actionBtn('start10','开始 10 题 →')}</div><div class="mode-card"><h3>本章全量 · \${c.quiz.length} 题</h3><p>覆盖全部知识点，适合阶段性复习。</p>\${actionBtn('start20',\`开始 \${c.quiz.length} 题 →\`,true)}</div></div><div class="practice-stats"><span>题库容量：\${ALL_QUESTIONS.size} 题</span><span>本章最佳：\${saved.bestPct[ui.chapter]!==undefined?saved.bestPct[ui.chapter]+'%':'尚无新版成绩'}</span></div>\`;
  const total=ui.quizItems.length,correct=currentScore();
  if(ui.finished){
    const pct=Math.round(100*correct/total),pass=pct>=70;
    return \`<div class="quiz-result"><div class="score-ring" style="border-color:\${pass?'#d1fae5':'#fee2e2'};color:\${pass?'var(--accent)':'var(--red)'}">\${pct}%</div><h3>\${pass?'练习达标！':'继续加油'}</h3><p>本次作答 \${total} 题，答对 \${correct} 题。答错题目已加入错题本。\${pass?'已记录达标状态。':'正确率满 70% 即可达标。'}</p><div class="review">\${ui.quizItems.map((id,i)=>{
      const q=ALL_QUESTIONS.get(id),ans=ui.answers[i],ok=ans===q.a;
      return \`<div class="review-item"><strong>\${i+1}. \${esc(q.q)}</strong><p>你的回答：\${ans!==undefined?esc(q.o[ans]):'未作答'} \${ok?'✓':'✕'}　<span class="answer">正确答案：\${esc(q.o[q.a])}</span></p><p>\${esc(q.why)}</p></div>\`;
    }).join('')}</div><div class="result-actions">\${actionBtn('restart-quiz','再练一次')}\${ui.chapter<5?actionBtn('next-chapter','下一章 →',true):''}\${actionBtn('show-wrong','查看错题本',true)}</div></div>\`;
  }
  const q=ALL_QUESTIONS.get(ui.quizItems[ui.qIndex]),sel=ui.answers[ui.qIndex];
  return \`<div class="quiz-step"><span>第 \${ui.qIndex+1} / \${total} 题</span><span>已答对 \${correct} 题</span></div><div class="quiz-question">\${esc(q.q)}</div><div class="choice-list">\${q.o.map((opt,i)=>\`<button type="button" class="choice \${sel===i?'selected':''} \${ui.checked?(i===q.a?'correct':sel===i?'wrong':''):''}" data-action="choice" data-index="\${i}" \${ui.checked?'disabled':''}><span class="choice-letter">\${String.fromCharCode(65+i)}</span><span>\${esc(opt)}</span></button>\`).join('')}</div>\${ui.checked?\`<div class="feedback \${sel===q.a?'':'incorrect'}"><strong>\${sel===q.a?'✓ 回答正确':'✕ 回答错误'}</strong><p>\${esc(q.why)}</p></div><div class="footer-actions"><span class="micro">\${ui.qIndex===total-1?'这是最后一题':'提交后进入下一题'}</span>\${actionBtn('quiz-next',ui.qIndex===total-1?'查看成绩结果 →':'下一题 →')}</div>\`:\`<div class="footer-actions"><span class="micro">单选题，请选择一个最符合的选项</span>\${actionBtn('quiz-check','核对答案',false,sel===undefined?'disabled':'')}</div>\`}\`;
}

function renderWrong(){
  const ids=activeWrongIds(),ever=everWrongIds();
  if(!ids.length)return \`<div class="empty-state"><span class="empty-icon">📖</span><h3>当前没有待复习错题</h3><p>\${ever.length?'你已经把之前的错题复习正确了。可以继续做章节练习。':'开始章节练习后，答错的题目会自动出现在这里。'}</p><div class="result-actions">\${actionBtn('go-quiz','去做章节练习 →')}</div></div>\`;
  const counts=COURSES.map((_,ch)=>ids.filter(id=>ALL_QUESTIONS.get(id).chapter===ch).length);
  return \`<div class="wrong-head"><div><h3 class="panel-title">待复习题目 \${ids.length} 道</h3><p class="panel-sub">累计曾答错 \${ever.length} 道 · 再次答对后自动移出待复习列表</p></div>\${actionBtn('review-wrong','开始错题复习 →')}</div><div class="wrong-chip-list">\${counts.map((n,ch)=>n?\`<span class="wrong-chip">\${esc(COURSES[ch].title)} \${n}</span>\`: '').join('')}</div><div class="wrong-list">\${ids.map(id=>{
    const q=ALL_QUESTIONS.get(id),s=saved.questionStats[id];
    return \`<article class="wrong-item"><span class="wrong-category">\${esc(COURSES[q.chapter].title)} · 错误 \${s.wrong} 次</span><h4>\${esc(q.q)}</h4><details><summary>查看答案与解析</summary><p><strong>正确答案：</strong>\${esc(q.o[q.a])}</p><p>\${esc(q.why)}</p></details><div class="wrong-item-actions"><button type="button" data-action="review-one" data-qid="\${esc(id)}">单题再练</button><button type="button" data-action="view-chapter" data-index="\${q.chapter}">复习本章知识</button></div></article>\`;
  }).join('')}</div>\`;
}

// Global click event dispatcher
document.addEventListener('click',event=>{
  const el=event.target.closest('[data-action]');
  // Also close mobile drawer if clicking a drawer item or backdrop
  if(event.target.closest('.sidebar button, .sidebar a, #sidebarBackdrop')){
    $('mainSidebar')?.classList.remove('drawer-open');
    $('sidebarBackdrop')?.classList.remove('open');
  }

  if(!el)return;
  const action=el.dataset.action,i=Number(el.dataset.index),c=COURSES[ui.chapter];
  switch(action){
    case 'chapter':resetChapter(i);break;
    case 'tab':if(el.dataset.tab==='quiz'){ui.quizItems=[];ui.finished=false;}changeTab(el.dataset.tab);break;
    case 'nav-home':case 'review-home':ui.tab='home';updateHashRoute();render();break;
    case 'nav-pathways':ui.tab='pathways';updateHashRoute();render();break;
    case 'nav-portfolio':ui.tab='portfolio';updateHashRoute();render();break;
    case 'nav-courses':resetChapter(ui.chapter,'learn');break;
    case 'nav-foundations':resetChapter(ui.chapter,'learn');break;
    case 'nav-practice':changeTab(dueIds().length?'review':'lab');break;
    case 'nav-review':case 'home-review':initReview();break;
    case 'nav-lab':case 'home-lab':changeTab('lab');break;
    case 'nav-mission':case 'home-mission':changeTab('mission');break;
    case 'nav-training':changeTab('training');break;
    case 'nav-textbook':case 'home-textbook':changeTab('textbook');break;
    case 'nav-projects':case 'home-projects':changeTab('projects');break;
    case 'nav-wrong':case 'show-wrong':changeTab('wrong');break;
    case 'nav-feedback':changeTab('feedback');break;
    case 'home-continue':resetChapter(i,'learn');break;
    case 'home-chapter':resetChapter(i,'learn');break;
    case 'concept':ui.opened=ui.opened===i?-1:i;render();break;
    case 'to-flash':changeTab('flash');break;
    case 'to-quiz':ui.quizItems=[];changeTab('quiz');break;
    case 'to-learn':resetChapter(ui.chapter,'learn');break;
    case 'go-quiz':ui.quizItems=[];changeTab('quiz');break;
    case 'view-chapter':resetChapter(i);break;
    case 'start10':startQuiz('chapter10');break;
    case 'start20':startQuiz('chapter20');break;
    case 'review-wrong':startQuiz('wrong');break;
    case 'review-one':startQuiz('wrong',[el.dataset.qid]);break;
    case 'restart-quiz':startQuiz(ui.quizMode);break;
    case 'flip':ui.flipped=!ui.flipped;render();break;
    case 'flash-prev':ui.flashIndex=Math.max(0,ui.flashIndex-1);ui.flipped=false;render();break;
    case 'flash-next':ui.flashIndex=Math.min(c.concepts.length-1,ui.flashIndex+1);ui.flipped=false;render();break;
    case 'remember':{const known=saved.known[ui.chapter]||{};known[ui.flashIndex]=!known[ui.flashIndex];saved.known[ui.chapter]=known;persist();render();break;}
    case 'review-flip':ui.reviewRevealed=!ui.reviewRevealed;render();break;
    case 'review-grade':{
      const id=el.dataset.cardid,grade=el.dataset.grade;
      if(!['again','hard','good','easy'].includes(grade)||!decodeCardId(id))break;
      if(ui.tab==='review'){
        if(!ui.reviewRevealed||id!==ui.reviewItems[ui.reviewIndex])break;
        gradeReviewCard(id,grade);ui.reviewIndex++;ui.reviewRevealed=false;render();
      }else if(ui.tab==='flash'){
        if(!ui.flipped||id!==cardId(ui.chapter,ui.flashIndex))break;
        gradeReviewCard(id,grade);
        const known=saved.known[ui.chapter]||{};known[ui.flashIndex]=grade!=='again';saved.known[ui.chapter]=known;persist();
        if(ui.flashIndex<COURSES[ui.chapter].concepts.length-1)ui.flashIndex++;
        ui.flipped=false;render();
      }
      break;
    }
    case 'review-to-flash':changeTab('flash');break;
    case 'review-exit':changeTab('home');break;
    case 'lab-select':ui.labMode=i;updateHashRoute();render();break;
    case 'mission-choice':{
      if(ui.missionChoice!==null)break;
      if(i<0||i>=MISSIONS[ui.chapter].steps[ui.missionStep].a.length)break;
      ui.missionChoice=i;render();break;
    }
    case 'mission-retry':ui.missionChoice=null;render();break;
    case 'mission-advance':{
      if(ui.missionChoice!==MISSIONS[ui.chapter].steps[ui.missionStep]?.ok)break;
      ui.missionStep++;ui.missionChoice=null;
      if(ui.missionStep===MISSIONS[ui.chapter].steps.length){saved.missions[ui.chapter]=Date.now();persist();}
      render();break;
    }
    case 'mission-repeat':ui.missionStep=0;ui.missionChoice=null;render();break;
    case 'mission-next':if(ui.chapter<5)resetChapter(ui.chapter+1,'mission');break;

    case 'choice':if(!ui.checked){ui.answers[ui.qIndex]=i;render();}break;
    case 'quiz-check':if(!ui.checked&&ui.answers[ui.qIndex]!==undefined){ui.checked=true;recordAttempt(ALL_QUESTIONS.get(ui.quizItems[ui.qIndex]),ui.answers[ui.qIndex]);render();}break;
    case 'quiz-next':if(!ui.checked)break;if(ui.qIndex===ui.quizItems.length-1)finishQuiz();else{ui.qIndex++;ui.checked=false;render();}break;
    case 'next-chapter':if(ui.chapter<5)resetChapter(ui.chapter+1);break;
    case 'clear':if(window.confirm('确定清除本机保存的章节成绩、翻转卡及错题记录吗？此操作无法撤销。')){saved=savedDefaults();persist();resetChapter(0);}break;
  }
});

// Close before module handlers replace the clicked sidebar node.
document.addEventListener('click',event=>{
  if(event.target.closest('#mainSidebar button,#mainSidebar a')){
    $('mainSidebar')?.classList.remove('drawer-open');
    $('sidebarBackdrop')?.classList.remove('open');
  }
},true);

// Mobile menu and drawer toggles
document.addEventListener('click',e=>{
  if(e.target.closest('#mobileMenuToggle, #mobileDrawerToggle')){
    $('mainSidebar')?.classList.toggle('drawer-open');
    $('sidebarBackdrop')?.classList.toggle('open');
  }else if(e.target.closest('#sidebarBackdrop')){
    $('mainSidebar')?.classList.remove('drawer-open');
    $('sidebarBackdrop')?.classList.remove('open');
  }
});

document.addEventListener('input',e=>{
  if(e.target?.id==='labThreshold'){
    ui.threshold=Number(e.target.value);updateLabLive();
  }else if(e.target?.id==='labTrainSplit'){
    ui.split=Number(e.target.value);updateLabLive();
  }else if(e.target?.id==='leakToggle'){
    ui.leak=e.target.checked;updateLabLive();
  }
});
document.addEventListener('change',e=>{if(e.target?.id==='leakToggle'){ui.leak=e.target.checked;updateLabLive();}});
document.addEventListener('keydown',e=>{
  if(ui.tab!=='flash'||e.altKey||e.ctrlKey||e.metaKey)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.key==='ArrowLeft'){e.preventDefault();ui.flashIndex=Math.max(0,ui.flashIndex-1);ui.flipped=false;render();}
  if(e.key==='ArrowRight'){e.preventDefault();ui.flashIndex=Math.min(COURSES[ui.chapter].concepts.length-1,ui.flashIndex+1);ui.flipped=false;render();}
  if(e.code==='Space'&&document.activeElement===document.body){e.preventDefault();ui.flipped=!ui.flipped;render();}
});

document.addEventListener('click',event=>{
  const link=event.target.closest('.book-toc a[href^="#"],.studio-steps-nav a[href^="#"]');
  if(!link)return;
  const id=link.getAttribute('href').slice(1);
  if(!document.getElementById(id))return;
  event.preventDefault();
  const parts=window.location.hash.split('?');
  const params=new URLSearchParams(parts[1]||'');
  params.set('anchor',id);
  history.replaceState(null,'',parts[0]+'?'+params.toString());
  restoreRouteAnchor();
});
window.addEventListener('hashchange',syncRouteFromHash);
render();
syncRouteFromHash();
`;

const finalHtml = part1 + 'const HOME_LESSONS = ' + JSON.stringify(learningLessons) + ';\n' + courseData + part3 + '\n</script>\n</body>\n</html>\n';
fs.writeFileSync(indexPath, finalHtml, 'utf8');
console.log('SUCCESS: index.html has been overhauled and written. Size:', finalHtml.length);
