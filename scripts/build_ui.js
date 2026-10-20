const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');
const indexPath = path.join(repoDir, 'index.html');
const oldHtml = fs.readFileSync(indexPath, 'utf8');

const sIdx = oldHtml.indexOf('const COURSES=');
const eIdx = oldHtml.indexOf('const REVIEW_INTERVALS=');
if (sIdx === -1 || eIdx === -1) {
  throw new Error('Course data markers not found');
}
const courseData = oldHtml.slice(sIdx, eIdx).replace(/(?:\s*\/\/ 透明的 V1\.2 简化复习间隔，不宣称为 FSRS。)+\s*$/, '').trimEnd() + '\n';

const part1 = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="人工智能基础学习：六大章节、30 个专题、144 道练习题，新增主动回忆、间隔复习、互动实验、情境闯关、深度教材与实战项目。">
  <title>AI 交互学习平台 · AI 探索实验室</title>
  <style>
    :root{
      --bg:#f8fafc;
      --surface:#ffffff;
      --ink:#0f172a;
      --ink-secondary:#334155;
      --muted:#64748b;
      --line:#e2e8f0;
      --accent:#5145e5;
      --accent-dark:#372abb;
      --accent-soft:#f0edff;
      --teal:#0d9488;
      --teal-soft:#f0fdfa;
      --amber:#d97706;
      --amber-soft:#fffbeb;
      --red:#e11d48;
      --red-soft:#fff1f2;
      --shadow:0 4px 14px rgba(15,23,42,0.035);
      --shadow-hover:0 10px 25px rgba(81,69,229,0.08);
      --radius:16px;
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
    button{font:inherit;cursor:pointer}
    button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    button:disabled{cursor:not-allowed;opacity:.5}
    .shell{max-width:1380px;padding:0 24px;margin:0 auto}

    /* Topbar & Primary Nav */
    .topbar{position:sticky;top:0;z-index:100;height:68px;background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
    .topbar-in{height:100%;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
    .brand-mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#6366f1);color:white;display:grid;place-items:center;font-size:20px;font-weight:700;box-shadow:0 4px 14px rgba(81,69,229,0.25)}
    .brand strong{display:block;font-size:15px;letter-spacing:-.2px;font-weight:800}
    .brand small{display:block;font-size:10px;letter-spacing:1.5px;color:var(--muted);font-weight:800}

    .main-nav{display:flex;align-items:center;gap:6px}
    .nav-item{background:transparent;border:1px solid transparent;border-radius:10px;padding:8px 14px;color:var(--ink-secondary);font-size:13px;font-weight:700;transition:all .15s ease}
    .nav-item:hover{background:#f1f5f9;color:var(--ink)}
    .nav-item.active{background:var(--accent-soft);color:var(--accent);border-color:#ddd8ff}

    .top-right{display:flex;align-items:center;gap:12px}
    .save-note{font-size:12px;color:var(--muted)}
    .header-pill{border:1px solid #deddfd;background:var(--accent-soft);color:#4338bf;border-radius:100px;font-size:12px;font-weight:750;padding:6px 12px;white-space:nowrap}
    .header-feedback-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#ffffff;color:var(--ink-secondary);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;transition:all .15s ease}
    .header-feedback-btn:hover,.header-feedback-btn.active{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
    .mobile-menu-toggle{display:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:#ffffff;color:var(--ink);place-items:center;font-size:18px}

    /* Sub Navigation Bar */
    .subnav-container{background:#ffffff;border-bottom:1px solid var(--line);padding:9px 0;position:sticky;top:68px;z-index:90}
    .subnav-in{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none}
    .subnav-in::-webkit-scrollbar{display:none}
    .subnav-label{font-size:12px;font-weight:800;color:var(--muted);white-space:nowrap;margin-right:4px}
    .subnav-pill{padding:6px 14px;border-radius:999px;font-size:12.5px;font-weight:700;border:1px solid var(--line);background:#ffffff;color:var(--ink-secondary);white-space:nowrap;transition:all .15s ease}
    .subnav-pill:hover{border-color:#c7d2fe;background:#f8fafc;color:var(--ink)}
    .subnav-pill.active{background:var(--accent);color:#ffffff;border-color:var(--accent);box-shadow:0 3px 10px rgba(81,69,229,0.2)}

    /* Mobile Subbar */
    .mobile-subbar{display:none;position:sticky;top:68px;z-index:85;background:#ffffff;border-bottom:1px solid var(--line);padding:8px 16px;align-items:center;justify-content:space-between;gap:10px}
    .drawer-toggle-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:#f8fafc;border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:700;color:var(--ink);max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

    /* Main Layout */
    .layout{display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px;padding-top:24px;padding-bottom:60px}
    .sidebar{align-self:start;position:sticky;top:84px;max-height:calc(100vh - 100px);overflow-y:auto}
    .side-panel{background:#fff;border-radius:18px;padding:18px 14px;border:1px solid var(--line);box-shadow:var(--shadow)}
    .side-overline{font-size:10px;color:var(--muted);letter-spacing:1.4px;font-weight:850;padding:0 8px;margin-bottom:12px}
    .side-group-title{font-size:11px;font-weight:800;color:var(--muted);letter-spacing:.5px;padding:12px 8px 6px}
    .chapter-nav{display:flex;flex-direction:column;gap:5px}
    .chapter-button{display:flex;align-items:center;gap:10px;text-align:left;background:transparent;border:1px solid transparent;border-radius:12px;padding:9px 10px;width:100%;color:var(--ink);transition:background .15s,border .15s}
    .chapter-button:hover{background:#f8fafc}
    .chapter-button.active{background:var(--accent-soft);border-color:#dcd7ff;color:var(--accent)}
    .chapter-no{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;background:#f1f5f9;color:#64748b;font-weight:800;font-size:11.5px}
    .chapter-button.active .chapter-no{background:var(--accent);color:#fff}
    .chapter-button.passed:not(.active) .chapter-no{background:var(--teal-soft);color:var(--teal)}
    .chapter-meta{min-width:0;flex:1}
    .chapter-meta strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chapter-meta small{display:block;color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .side-footer{border-top:1px solid var(--line);margin-top:14px;padding:12px 6px 0;display:flex;flex-direction:column;gap:6px}
    .side-footer button{background:transparent;border:0;color:var(--muted);font-size:11px;padding:4px 0;text-align:left;cursor:pointer}
    .side-footer button:hover{color:var(--red)}
    .side-footer .side-link-btn{color:var(--accent);font-weight:600}
    .side-home-stats{display:grid;gap:8px;padding:4px 8px 10px}
    .side-home-stats>div{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
    .side-home-stats strong{color:var(--ink);font-weight:700}
    .book-sidebar-progress{background:#f1f5f9;height:6px;border-radius:999px;overflow:hidden;margin:6px 8px 12px}
    .book-sidebar-progress span{display:block;height:100%;background:var(--accent);border-radius:inherit;transition:width .25s}

    /* Content Area */
    .content{min-width:0}

    /* Hero Banner (Shown only on Home) */
    .hero{background:linear-gradient(135deg,#1e1b4b 0%,#2e287a 50%,#4338ca 100%);color:white;border-radius:22px;padding:34px 38px 28px;position:relative;overflow:hidden;margin-bottom:20px;box-shadow:0 12px 30px rgba(30,27,75,0.08)}
    .hero::before{content:"";position:absolute;right:-60px;top:-80px;width:300px;height:300px;border:1px solid rgba(255,255,255,0.12);border-radius:50%;box-shadow:0 0 0 36px rgba(255,255,255,0.03),0 0 0 72px rgba(255,255,255,0.03)}
    .hero-overline{color:#c7d2fe;font-size:10.5px;font-weight:850;letter-spacing:2px}
    .hero h1{font-size:clamp(25px,3.4vw,38px);letter-spacing:-.8px;line-height:1.3;margin:12px 0 8px;max-width:650px;position:relative}
    .hero h1 em{font-style:normal;color:#a7f3d0}
    .hero p{position:relative;font-size:14px;color:#e0e7ff;max-width:620px;margin:0 0 22px;line-height:1.8}
    .hero-stats{display:flex;gap:26px;position:relative;flex-wrap:wrap}
    .stat{display:flex;align-items:baseline;gap:6px}
    .stat strong{font-size:22px;letter-spacing:-.5px}
    .stat small{color:#c7d2fe;font-size:12px}

    .progress-strip{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:18px;margin-bottom:24px;box-shadow:var(--shadow)}
    .progress-info{min-width:180px}
    .progress-info strong{display:block;font-size:13px}
    .progress-info small{display:block;color:var(--muted);font-size:11px;margin-top:2px}
    .bar{height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;flex:1}
    .bar >span{display:block;height:100%;border-radius:100px;background:linear-gradient(90deg,var(--accent),#0d9488);transition:width .4s}
    .percent{font-size:15px;font-weight:900;color:var(--accent);white-space:nowrap}

    /* Home Hub: Smart Resume & Tracks */
    .home-resume{background:linear-gradient(135deg,#f5f3ff 0%,#ffffff 100%);border:1px solid #ddd6fe;border-radius:18px;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}
    .home-resume-main{min-width:0}
    .home-resume-main .eyebrow{margin-bottom:4px}
    .home-resume-main h3{margin:4px 0 6px;font-size:20px;color:var(--ink)}
    .home-resume-main p{margin:0;color:var(--ink-secondary);font-size:13.5px}
    .home-resume-action{flex-shrink:0}
    .home-tracks-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:24px}
    .home-track-card{background:#ffffff;border:1px solid var(--line);border-radius:16px;padding:22px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;cursor:pointer;transition:all .2s ease;box-shadow:var(--shadow)}
    .home-track-card:hover{border-color:#a5b4fc;box-shadow:var(--shadow-hover);transform:translateY(-2px)}
    .home-track-top{width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .home-track-icon{width:42px;height:42px;border-radius:12px;background:var(--accent-soft);display:grid;place-items:center;font-size:22px}
    .home-track-badge{font-size:11.5px;font-weight:750;color:var(--accent);background:var(--accent-soft);padding:4px 10px;border-radius:999px}
    .home-track-card h4{margin:0 0 6px;font-size:17px;color:var(--ink)}
    .home-track-card p{margin:0 0 16px;font-size:13px;color:var(--muted);line-height:1.7;flex:1}
    .home-track-cta{font-size:12.5px;font-weight:750;color:var(--accent);display:inline-flex;align-items:center;gap:4px}
    .home-quick-practice{background:#ffffff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-bottom:24px}
    .home-quick-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .home-quick-head h4{margin:0;font-size:15px;color:var(--ink)}
    .home-quick-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .home-quick-btn{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#f8fafc;text-align:left;cursor:pointer;transition:all .15s ease}
    .home-quick-btn:hover{border-color:#cbd5e1;background:#ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.04)}
    .home-quick-btn span{font-size:20px}
    .home-quick-btn div strong{display:block;font-size:13px;color:var(--ink)}
    .home-quick-btn div small{display:block;font-size:11px;color:var(--muted)}

    /* Section Header & Subnav in Content */
    .section-header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:18px}
    .eyebrow{color:var(--accent);font-size:11px;font-weight:850;letter-spacing:1.5px}
    .section-header h2{font-size:26px;margin:5px 0 5px;letter-spacing:-.5px;line-height:1.35}
    .section-header p{font-size:13.5px;color:var(--muted);margin:0;line-height:1.8;max-width:650px}
    .status-pill{background:var(--accent-soft);border:1px solid #e1defe;color:var(--accent);white-space:nowrap;border-radius:100px;padding:5px 12px;font-size:12px;font-weight:750;margin-top:14px}
    .status-pill.complete{background:var(--teal-soft);border-color:#ceebdf;color:var(--teal)}

    .tabs{display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid var(--line);overflow-x:auto}
    .tab{color:var(--muted);background:transparent;border:0;border-bottom:3px solid transparent;font-weight:700;font-size:13px;padding:11px 16px;white-space:nowrap;transition:color .15s}
    .tab:hover{color:var(--accent)}
    .tab.active{color:var(--accent);border-color:var(--accent)}

    .panel{border:1px solid var(--line);border-radius:18px;background:white;box-shadow:var(--shadow);padding:26px}
    .panel-title{font-weight:850;font-size:16px;margin:0 0 5px;color:var(--ink)}
    .panel-sub{font-size:12.5px;color:var(--muted);margin:0}

    /* Common Components: Deep dive, concepts, flashcards, quizzes */
    .concept-list{display:grid;gap:9px;margin-top:20px}
    .concept{border:1px solid var(--line);border-radius:13px;overflow:hidden}
    .concept-head{width:100%;background:#fff;text-align:left;border:0;padding:14px 16px;display:flex;align-items:center;gap:12px}
    .concept-head:hover{background:#fafaff}
    .concept-index{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:9px;background:#f1f0ff;color:var(--accent);font-size:12px;font-weight:850}
    .concept-name{font-weight:750;font-size:14px;flex:1}
    .chevron{color:#8790a4;font-size:16px}
    .concept-body{background:#fbfbff;border-top:1px solid #efeff9;padding:16px 18px 18px 58px;font-size:13px;color:#4c5870;line-height:1.9}
    .concept-body p{margin:0}
    .insight{border-radius:13px;margin-top:18px;background:#eff8f6;display:flex;gap:11px;padding:16px 18px;border:1px solid #d9ede8}
    .insight i{font-style:normal;font-size:20px}
    .insight strong{color:#117b69;font-size:13px}
    .insight p{font-size:13px;margin:4px 0 0;color:#476f68;line-height:1.85}
    .footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:23px;gap:10px;flex-wrap:wrap}

    .btn{background:var(--accent);border:1px solid var(--accent);border-radius:10px;color:white;font-weight:750;font-size:13px;padding:10px 18px;transition:background .15s,transform .15s;white-space:nowrap}
    .btn:hover:not(:disabled){background:var(--accent-dark);transform:translateY(-1px)}
    .btn-secondary{background:#fff;color:#566179;border-color:#dde2ef}
    .btn-secondary:hover:not(:disabled){background:#f5f6fb}
    .btn-success{background:var(--teal);border-color:var(--teal)}
    .btn-success:hover:not(:disabled){background:#087663}
    .micro{font-size:12px;color:var(--muted)}

    .flash-layout{max-width:650px;margin:0 auto}
    .flash-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:0 0 15px}
    .flash-top span{font-size:12px;color:var(--muted)}
    .flash-card{background:linear-gradient(135deg,#f5f3ff,#ffffff);border:1px solid #ddd6fe;border-radius:20px;width:100%;min-height:250px;padding:28px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:14px;color:var(--ink);box-shadow:0 8px 24px rgba(81,69,229,0.06);transition:background .2s}
    .flash-card:hover{background:#ede9fe}
    .flash-card.is-back{background:linear-gradient(130deg,#e8f8f4,#f5fcfa);border-color:#bde5d8}
    .flash-small{font-size:11px;color:var(--accent);font-weight:800;letter-spacing:1.5px}
    .flash-card.is-back .flash-small{color:var(--teal)}
    .flash-primary{font-size:clamp(20px,2.8vw,26px);font-weight:850;line-height:1.5}
    .flash-card.is-back .flash-primary{font-weight:600;font-size:16px}
    .flash-help{font-size:12px;color:#8992a5}
    .flash-controls{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:17px}
    .flash-controls .btn{min-width:100px}
    .known-count{text-align:center;margin-top:15px;color:var(--muted);font-size:12px}

    .quiz-step{color:var(--muted);font-weight:700;font-size:12px;display:flex;justify-content:space-between;align-items:center}
    .quiz-question{font-weight:800;font-size:19px;line-height:1.6;margin:16px 0 20px}
    .choice-list{display:grid;gap:10px}
    .choice{border:1px solid var(--line);background:#fff;border-radius:11px;display:flex;align-items:center;gap:12px;text-align:left;color:var(--ink);padding:13px 15px;line-height:1.6;font-size:13.5px}
    .choice:hover:not(:disabled){border-color:#a5b4fc;background:#faf5ff}
    .choice.selected{border-color:var(--accent);background:#f5f3ff}
    .choice.correct{border-color:#a7f3d0;background:#ecfdf5}
    .choice.wrong{border-color:#fecdd3;background:#fff1f2}
    .choice-letter{width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:#f1f5f9;font-size:12px;font-weight:850;flex:0 0 auto}
    .choice.selected .choice-letter{background:#ddd6fe;color:var(--accent)}
    .feedback{padding:16px 18px;border-radius:12px;background:var(--teal-soft);color:#137963;font-size:13px;margin-top:18px;border:1px solid #cbefe3}
    .feedback.incorrect{color:#97504d;background:var(--red-soft);border-color:#f6d7dc}
    .feedback strong{display:block;margin-bottom:5px}
    .feedback p{margin:0;line-height:1.8}
    .quiz-result{text-align:center;padding:15px 0}
    .score-ring{height:114px;width:114px;border:8px solid #dff5ee;border-radius:100px;display:grid;place-items:center;margin:0 auto 16px;font-size:30px;font-weight:900;color:var(--teal)}
    .quiz-result h3{font-size:22px;margin:0 0 8px}
    .quiz-result p{color:var(--muted);font-size:13px}
    .review{display:grid;gap:9px;text-align:left;margin:22px 0}
    .review-item{border:1px solid var(--line);border-radius:12px;padding:14px;font-size:12px}
    .review-item strong{display:block;font-size:13px;margin-bottom:5px}
    .review-item p{margin:5px 0;color:var(--muted);line-height:1.8}
    .review-item .answer{color:var(--teal);font-weight:750}
    .result-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}

    .deep-list{display:grid;gap:12px;margin:20px 0 26px}
    .deep-card{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff}
    .deep-card[open]{border-color:#c7d2fe;background:#fbfbff}
    .deep-card summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:16px;font-size:14px}
    .deep-card summary::-webkit-details-marker{display:none}
    .deep-card summary strong{flex:1;color:var(--ink)}
    .deep-card summary:hover{background:#f8fafc}
    .deep-num{background:var(--accent-soft);color:var(--accent);width:28px;height:28px;flex:0 0 28px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:12px}
    .deep-toggle{font-size:11px;color:var(--muted)}
    .deep-detail{border-top:1px solid #eaebf9;padding:15px 19px 19px;font-size:13px;line-height:1.95;color:#42506b}
    .deep-detail>p{margin:0 0 12px}
    .scenario,.pitfall{border-radius:10px;padding:12px 15px;margin-top:10px}
    .scenario{background:#eaf7f2}
    .pitfall{background:#fff6e8}
    .scenario strong{color:#167960}
    .pitfall strong{color:#a16a21}
    .scenario p,.pitfall p{margin:4px 0 0}
    .section-divider{margin-top:28px;border-top:1px solid var(--line);padding-top:20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
    .section-divider strong{font-size:15.5px}
    .section-divider span{font-size:12px;color:var(--muted)}
    .mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0}
    .mode-card{border:1px solid var(--line);background:#f8fafc;padding:20px;border-radius:14px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
    .mode-card h3{margin:0;font-size:16.5px}
    .mode-card p{font-size:12px;color:var(--muted);margin:0;min-height:38px}
    .mode-card button{margin-top:auto}
    .practice-stats{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:12px}

    /* Wrong questions */
    .wrong-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .wrong-chip-list{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0}
    .wrong-chip{background:var(--accent-soft);color:var(--accent);border:1px solid #ddd6fe;border-radius:30px;padding:4px 12px;font-size:11px;font-weight:700}
    .wrong-list{display:grid;gap:12px;margin-top:15px}
    .wrong-item{border:1px solid var(--line);background:#fff;border-radius:14px;padding:18px}
    .wrong-item h4{font-size:14px;line-height:1.7;margin:7px 0 9px}
    .wrong-category{font-size:11px;color:var(--accent);font-weight:800}
    .wrong-item details{font-size:12px;color:#4d5d75;line-height:1.8}
    .wrong-item details summary{cursor:pointer;color:var(--teal);font-weight:800}
    .wrong-item details p{margin:7px 0}
    .wrong-item-actions{display:flex;gap:15px;margin-top:12px}
    .wrong-item-actions button{color:var(--accent);font-size:12px;font-weight:750;background:none;border:0;padding:0}
    .wrong-item-actions button:hover{text-decoration:underline}
    .empty-state{text-align:center;padding:40px 10px}
    .empty-icon{font-size:40px}
    .empty-state h3{font-size:19px;margin:10px 0}
    .empty-state p{color:var(--muted);font-size:13px;line-height:1.8;max-width:480px;margin:0 auto 18px}

    /* Active recall & Review */
    .recall-card{background:linear-gradient(135deg,#f5f3ff,#ffffff);border:1px solid #ddd6fe;border-radius:20px;min-height:230px;padding:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;width:100%}
    .recall-card.revealed{background:linear-gradient(130deg,#ecfdf5,#ffffff);border-color:#a7f3d0}
    .recall-eyebrow{font-size:11px;font-weight:850;letter-spacing:1.5px;color:var(--accent)}
    .recall-text{font-size:clamp(19px,2.5vw,26px);font-weight:850;line-height:1.6;max-width:590px}
    .recall-card.revealed .recall-text{font-size:16px;font-weight:600}
    .recall-reminder{font-size:12px;color:var(--muted)}
    .rating-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:16px}
    .rating{border:1px solid #e2e8f0;border-radius:11px;background:#fff;padding:12px 6px;font-size:12px;font-weight:800;color:var(--ink)}
    .rating:hover{background:var(--accent-soft);border-color:#a5b4fc}
    .rating small{display:block;font-size:10px;font-weight:500;color:var(--muted)}
    .recall-note{font-size:12px;color:var(--muted);padding:12px 0;line-height:1.8}
    .empty-memory{text-align:center;padding:32px 18px}
    .empty-memory h3{margin:8px 0}
    .empty-memory p{font-size:13px;color:var(--muted)}

    /* Labs & Missions */
    .lab-selector{display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap}
    .lab-selector button{border:1px solid #e2e8f0;color:#475569;background:#fff;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:800}
    .lab-selector button.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .lab-console{background:#f8fafc;border-radius:16px;padding:22px;border:1px solid #e2e8f0}
    .lab-top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:14px}
    .lab-top h3{margin:0;font-size:18px}
    .lab-top p{font-size:12px;color:var(--muted);margin:4px 0 0}
    .lab-setting{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;margin-bottom:14px}
    .lab-setting label{display:flex;justify-content:space-between;font-size:13px;font-weight:800;gap:15px;margin-bottom:10px}
    .lab-setting input[type=range]{width:100%;accent-color:var(--accent);cursor:pointer}
    .lab-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:15px 0}
    .lab-metric{background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:12px 8px;text-align:center}
    .lab-metric strong{display:block;font-size:20px;color:var(--accent);line-height:1.25}
    .lab-metric span{display:block;margin-top:4px;font-size:11px;color:var(--muted)}
    .lab-devices{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .lab-device{border:1px solid #e2e8f0;padding:10px 7px;background:#fff;border-radius:11px;text-align:center}
    .lab-device b{display:block;font-size:15px}
    .lab-device small{display:block;color:#64748b;font-size:10px;margin-top:2px}
    .lab-device.positive{background:#ecfdf5;border-color:#a7f3d0}
    .lab-device.false-positive{background:#fffbeb;border-color:#fde68a}
    .lab-device.false-negative{background:#fff1f2;border-color:#fecdd3}
    .lab-notice{border-left:4px solid var(--accent);background:#f5f3ff;color:#3730a3;border-radius:8px;padding:12px 14px;font-size:12px;margin-top:16px;line-height:1.8}
    .train-segments{height:30px;display:flex;overflow:hidden;border-radius:8px;margin:12px 0 8px}
    .train-segments span{height:100%;display:flex;align-items:center;justify-content:center;min-width:0;font-size:10px;font-weight:800;color:white;white-space:nowrap}
    .split-train{background:#5145e5}
    .split-valid{background:#0d9488}
    .split-test{background:#d97706}
    .lab-toggle{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:700;margin-top:16px;cursor:pointer}
    .lab-toggle input{accent-color:var(--accent);width:16px;height:16px}

    .quest-step{border:1px solid #e2e8f0;background:#f8fafc;padding:22px;border-radius:16px}
    .quest-step h3{margin:8px 0 9px;font-size:20px;line-height:1.5}
    .quest-step p{color:#475569;font-size:13px;line-height:1.85}
    .quest-choices{display:grid;gap:10px;margin:16px 0}
    .quest-choice{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:13px 16px;text-align:left;font-size:13px;font-weight:700;line-height:1.6}
    .quest-choice:hover{background:#faf5ff;border-color:#a5b4fc}
    .quest-choice.selected{border-color:var(--accent);background:#f5f3ff}
    .quest-feedback{padding:14px;border-radius:12px;font-size:13px;margin-top:12px;line-height:1.8}
    .quest-feedback.good{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}
    .quest-feedback.bad{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
    .quest-end{text-align:center;padding:32px 15px}
    .quest-end .quest-icon{font-size:44px}
    .quest-end h3{font-size:21px}
    .quest-dots{display:flex;gap:7px;margin:0 0 15px}
    .quest-dot{width:36px;height:6px;border-radius:20px;background:#e2e8f0}
    .quest-dot.done{background:var(--teal)}
    .quest-dot.active{background:var(--accent)}

    .footnote{text-align:center;margin-top:32px;color:#94a3b8;font-size:11.5px}
    .hidden{display:none!important}

    /* Sidebar Drawer Backdrop */
    .sidebar-backdrop{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.45);z-index:998;opacity:0;pointer-events:none;transition:opacity .25s ease}
    .sidebar-backdrop.open{opacity:1;pointer-events:auto}

    /* Responsive queries */
    @media(max-width:1080px){
      .layout{grid-template-columns:230px minmax(0,1fr);gap:20px}
      .shell{padding-left:18px;padding-right:18px}
    }
    @media(max-width:880px){
      .main-nav{display:none}
      .mobile-menu-toggle{display:grid}
      .mobile-subbar{display:flex}
      .layout{display:block;padding-top:16px}
      .sidebar{position:fixed;top:0;left:0;bottom:0;width:310px;max-width:85vw;z-index:999;transform:translateX(-100%);transition:transform .25s ease;background:#ffffff;box-shadow:0 10px 40px rgba(0,0,0,0.25);border-radius:0;padding:16px;max-height:none;overflow-y:auto}
      .sidebar.drawer-open{transform:translateX(0)}
      .sidebar-backdrop{display:block}
      .home-tracks-grid{grid-template-columns:1fr}
      .home-quick-row{grid-template-columns:repeat(2,minmax(0,1fr))}
      .home-resume{flex-direction:column;align-items:flex-start}
      .home-resume-action{width:100%}
      .home-resume-action .btn{width:100%}
    }
    @media(max-width:540px){
      .topbar{height:54px}
      .mobile-subbar{padding:7px 14px}
      .subnav-container{padding:6px 0}
      .layout{padding-top:10px}
      .top-right .header-pill,.save-note{display:none}
      .hero{padding:26px 20px;border-radius:18px}
      .hero h1{font-size:24px}
      .hero p{font-size:13px}
      .hero-stats{gap:14px}
      .progress-strip{padding:14px;gap:12px;flex-wrap:wrap}
      .progress-info{min-width:100%}
      .home-quick-row{grid-template-columns:1fr}
      .rating-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .lab-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
      .mode-grid{grid-template-columns:1fr}
      .section-header{flex-direction:column}
      .status-pill{margin-top:6px}
      .panel{padding:18px 15px}
    }
  </style>
  <link rel="stylesheet" href="./content/reader.css">
  <link rel="stylesheet" href="./projects/projects.css">
  <link rel="stylesheet" href="./training/training.css">
  <link rel="stylesheet" href="./feedback/feedback.css">
</head>
<body>
<header class="topbar">
  <div class="shell topbar-in">
    <a class="brand" href="#home" data-action="nav-home" aria-label="AI 交互学习平台首页">
      <span class="brand-mark">✳</span>
      <span><strong>AI 交互学习平台</strong><small>AI LEARNING LAB</small></span>
    </a>
    <nav class="main-nav" aria-label="全站主要模块">
      <button type="button" class="nav-item active" data-action="nav-home" data-main-nav="home">⌂ 学习首页</button>
      <button type="button" class="nav-item" data-action="nav-courses" data-main-nav="courses">📚 课程学习</button>
      <button type="button" class="nav-item" data-action="nav-projects" data-main-nav="projects">🛠️ 实战项目</button>
      <button type="button" class="nav-item" data-action="nav-practice" data-main-nav="practice">✍️ 练习复习</button>
    </nav>
    <div class="top-right">
      <span class="save-note">◎ 学习记录仅保存在本机</span>
      <span class="header-pill" id="headerProgress">练习达标 0 / 6 章</span>
      <button type="button" class="header-feedback-btn" data-action="nav-feedback" title="意见与反馈">
        <span>✉ 反馈</span>
      </button>
      <button type="button" class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="切换目录导航">
        <span>☰</span>
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

<div class="shell layout">
  <aside class="sidebar" id="mainSidebar" aria-label="学习导航与目录">
    <div class="side-panel" id="sidePanelContent"></div>
  </aside>

  <main class="content" id="mainContent">
    <div id="homeHeroArea">
      <section class="hero">
        <div class="hero-overline">FOUNDATIONS · AI 基础与进阶</div>
        <h1>从概念到实践，<br><em>系统学会人工智能。</em></h1>
        <p>六大基础章节 · 8 篇原创深度教材 · 4 项可验证实战项目 · 16 天实战集训 · 间隔复习与错题巩固。</p>
        <div class="hero-stats">
          <div class="stat"><strong>06</strong><small>系统章节</small></div>
          <div class="stat"><strong id="conceptTotal">28</strong><small>基础概念</small></div>
          <div class="stat"><strong id="questionTotal">144</strong><small>题库练习</small></div>
          <div class="stat"><strong>08</strong><small>深度教材</small></div>
          <div class="stat"><strong>04</strong><small>实战项目</small></div>
        </div>
      </section>
      <section class="progress-strip" aria-label="课程完成进度">
        <div class="progress-info">
          <strong>整体学习进度</strong>
          <small id="progressText">已掌握 0 章 · 继续学习</small>
        </div>
        <div class="bar" role="progressbar" aria-label="掌握章节比例" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="progressBar">
          <span id="progressFill" style="width:0%"></span>
        </div>
        <div class="percent" id="progressPct">0%</div>
      </section>
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
<script src="./projects/logic.js"></script>
<script src="./projects/guides.js"></script>
<script src="./projects/app.js"></script>
<script src="./training/training-data.js"></script>
<script src="./training/training-ui.js"></script>
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

function renderHome(){
  const mastered=score(),due=dueIds().length,doneMissions=Object.values(saved.missions||{}).filter(Boolean).length;
  const tbProgress=(typeof Textbook!=='undefined'&&Textbook.getProgress)?Textbook.getProgress():{completed:0,total:8};
  const tbDone=tbProgress?tbProgress.completed:0;
  const projProgress=(typeof ProjectLab!=='undefined'&&ProjectLab.getProgress)?ProjectLab.getProgress():{};
  const projDone=Object.values(projProgress).filter(Boolean).length;
  const wrongCount=activeWrongIds().length;

  // Smart Resume Target determination
  let resumeTitle='',resumeDesc='',resumeBtnText='',resumeAction='',resumeParam='';
  if(due>0){
    resumeTitle=\`今日有 \${due} 张记忆卡到期复习\`;
    resumeDesc='通过主动回忆检验概念掌握，依据回忆熟练度安排间隔周期。';
    resumeBtnText='立即开始复习 →';
    resumeAction='home-review';
  }else{
    const nextCh=COURSES.findIndex((_,i)=>!saved.mastered[i]);
    if(nextCh!==-1){
      resumeTitle=\`继续基础学习：第 \${nextCh+1} 章《\${esc(COURSES[nextCh].title)}》\`;
      resumeDesc='深入系统专题剖析、概念卡片主动回忆与章节习题检验。';
      resumeBtnText='继续本章学习 →';
      resumeAction='home-continue';
      resumeParam=\`data-index="\${nextCh}"\`;
    }else if(tbDone<8){
      resumeTitle='继续阅读系统教材';
      resumeDesc='探索前沿原理推导、RAG 检索、Agent 架构与本地真实计算实验。';
      resumeBtnText='进入系统教材 →';
      resumeAction='home-textbook';
    }else if(projDone<4){
      resumeTitle='推进实战项目研发';
      resumeDesc='在沙箱中完成标注一致性评估、朴素贝叶斯模型或 Agent 授权调度。';
      resumeBtnText='进入实战项目 →';
      resumeAction='home-projects';
    }else{
      resumeTitle='六章基础全部达标！';
      resumeDesc='你可以继续探索实战项目、完成延伸挑战或复习错题。';
      resumeBtnText='查看错题本 →';
      resumeAction='show-wrong';
    }
  }

  return \`
  <div class="home-resume">
    <div class="home-resume-main">
      <div class="eyebrow">CONTINUE · 继续学习</div>
      <h3>\${resumeTitle}</h3>
      <p>\${resumeDesc}</p>
    </div>
    <div class="home-resume-action">
      <button type="button" class="btn" data-action="\${resumeAction}" \${resumeParam}>\${resumeBtnText}</button>
    </div>
  </div>

  <div class="section-divider" style="margin-top:0;border:0;padding:0 0 14px">
    <strong>核心学习通道</strong>
    <span>四个递进体系，支持自由切换</span>
  </div>

  <div class="home-tracks-grid">
    <div class="home-track-card" data-action="nav-foundations">
      <div class="home-track-top">
        <span class="home-track-icon">📖</span>
        <span class="home-track-badge">达标 \${mastered} / 6 章</span>
      </div>
      <h4>基础六章与题库</h4>
      <p>30 个深入专题全面梳理 AI 概念；144 道题库即时答题反馈，支持错题智能归纳与重练。</p>
      <span class="home-track-cta">开始基础学习 →</span>
    </div>

    <div class="home-track-card" data-action="nav-textbook">
      <div class="home-track-top">
        <span class="home-track-icon">📚</span>
        <span class="home-track-badge">已读 \${tbDone} / 8 篇</span>
      </div>
      <h4>系统教材与实验</h4>
      <p>从 Transformer、RAG 到数据工程的 8 篇深度原创教材；配备梯度下降与检索真实计算实验。</p>
      <span class="home-track-cta">进入深度教材 →</span>
    </div>

    <div class="home-track-card" data-action="nav-projects">
      <div class="home-track-top">
        <span class="home-track-icon">🛠️</span>
        <span class="home-track-badge">已达标 \${projDone} / 4 项目</span>
      </div>
      <h4>可验证实战项目</h4>
      <p>标注一致性分析、朴素贝叶斯邮件分类、TF-IDF 检索评测与受控日历 Agent，导出真实交付物。</p>
      <span class="home-track-cta">开启实战项目 →</span>
    </div>

    <div class="home-track-card" data-action="nav-training">
      <div class="home-track-top">
        <span class="home-track-icon">🗓️</span>
        <span class="home-track-badge">32 单元实战</span>
      </div>
      <h4>16 天培训大纲</h4>
      <p>完整对照培训师实训大纲：32 个半天任务、64 道专项题、32 张机制误区卡与 4 项微实验。</p>
      <span class="home-track-cta">查看培训集训 →</span>
    </div>
  </div>

  <div class="home-quick-practice">
    <div class="home-quick-head">
      <h4>练习强化与巩固</h4>
      <span class="micro">碎片化复习 · 边练边学</span>
    </div>
    <div class="home-quick-row">
      <button type="button" class="home-quick-btn" data-action="nav-review">
        <span>🧠</span>
        <div>
          <strong>今日复习</strong>
          <small>\${due} 张卡片到期</small>
        </div>
      </button>
      <button type="button" class="home-quick-btn" data-action="nav-lab">
        <span>🔬</span>
        <div>
          <strong>互动实验</strong>
          <small>阈值设定与划分</small>
        </div>
      </button>
      <button type="button" class="home-quick-btn" data-action="nav-mission">
        <span>🏅</span>
        <div>
          <strong>场景闯关</strong>
          <small>\${doneMissions} / 6 关完成</small>
        </div>
      </button>
      <button type="button" class="home-quick-btn" data-action="show-wrong">
        <span>📝</span>
        <div>
          <strong>错题本</strong>
          <small>\${wrongCount} 道待巩固</small>
        </div>
      </button>
    </div>
  </div>
  <p class="recall-note">学习说明：基础章节练习、深度教材阅读、实战项目与间隔复习记录独立保存在本地，换设备或清理存储不会自动同步。</p>\`;
}

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
  chapter:0,tab:'home',opened:0,flashIndex:0,flipped:false,
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
  if(['learn','flash','quiz','textbook','training'].includes(ui.tab))return 'courses';
  if(ui.tab==='projects')return 'projects';
  if(['review','lab','mission','wrong'].includes(ui.tab))return 'practice';
  if(ui.tab==='feedback')return 'feedback';
  return 'home';
}

/* URL Hash Route Synchronization */
function updateHashRoute(){
  let hash='#home';
  if(ui.tab==='home')hash='#home';
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

  if(route==='courses'||route==='foundations'){
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

/* Dynamic Subnav Bar update */
function updateSubNav(){
  const nav=currentMainNav(),box=$('subNavBar'),inner=$('subNavBarInner');
  if(!box||!inner)return;
  if(nav==='courses'){
    box.style.display='block';
    const isFoundations=['learn','flash','quiz'].includes(ui.tab);
    inner.innerHTML=\`
      <span class="subnav-label">课程通道：</span>
      <button type="button" class="subnav-pill \${isFoundations?'active':''}" data-action="nav-foundations">📖 基础六章（144题）</button>
      <button type="button" class="subnav-pill \${ui.tab==='textbook'?'active':''}" data-action="nav-textbook">📚 系统教材（8篇）</button>
      <button type="button" class="subnav-pill \${ui.tab==='training'?'active':''}" data-action="nav-training">🗓️ 16 天培训（32单元）</button>
    \`;
  }else if(nav==='practice'){
    box.style.display='block';
    const due=dueIds().length,wrong=activeWrongIds().length;
    inner.innerHTML=\`
      <span class="subnav-label">复习强化：</span>
      <button type="button" class="subnav-pill \${ui.tab==='review'?'active':''}" data-action="nav-review">🧠 今日复习\${due?\` (\${due})\`:''}</button>
      <button type="button" class="subnav-pill \${ui.tab==='lab'?'active':''}" data-action="nav-lab">🔬 互动实验</button>
      <button type="button" class="subnav-pill \${ui.tab==='mission'?'active':''}" data-action="nav-mission">🏅 场景闯关</button>
      <button type="button" class="subnav-pill \${ui.tab==='wrong'?'active':''}" data-action="nav-wrong">📝 错题本\${wrong?\` (\${wrong})\`:''}</button>
    \`;
  }else if(nav==='projects'){
    box.style.display='block';
    const sel=(typeof ProjectLab!=='undefined'&&ProjectLab.getSelected)?ProjectLab.getSelected():null;
    inner.innerHTML=\`
      <span class="subnav-label">实战项目：</span>
      <button type="button" class="subnav-pill \${sel===null?'active':''}" data-project="back">概览</button>
      <button type="button" class="subnav-pill \${sel==='label'?'active':''}" data-project="open" data-id="label">01 标注评估</button>
      <button type="button" class="subnav-pill \${sel==='ml'?'active':''}" data-project="open" data-id="ml">02 贝叶斯分类</button>
      <button type="button" class="subnav-pill \${sel==='rag'?'active':''}" data-project="open" data-id="rag">03 检索问答</button>
      <button type="button" class="subnav-pill \${sel==='agent'?'active':''}" data-project="open" data-id="agent">04 智能体工具</button>
    \`;
  }else{
    box.style.display='none';
  }
}

/* Context-Aware Main Sidebar */
function updateMainSidebar(){
  const panel=$('sidePanelContent');
  if(!panel)return;
  const mastered=score(),wrong=activeWrongIds().length,due=dueIds().length;

  if(['learn','flash','quiz'].includes(ui.tab)){
    panel.innerHTML=\`
      <div class="side-overline">FOUNDATIONS · 基础六章目录</div>
      <nav class="chapter-nav" id="chapterNav">
        \${COURSES.map((c,i)=>\`
          <button type="button" class="chapter-button \${i===ui.chapter?'active':''} \${saved.mastered[i]?'passed':''}" data-action="chapter" data-index="\${i}">
            <span class="chapter-no">\${saved.mastered[i]?'✓':String(i+1).padStart(2,'0')}</span>
            <span class="chapter-meta">
              <strong>\${esc(c.title)}</strong>
              <small>\${saved.mastered[i]?'✓ 练习达标':'◷ 待达标'} · \${esc(c.subtitle)}</small>
            </span>
          </button>
        \`).join('')}
      </nav>
      <div class="side-footer">
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
      <div class="side-overline">TEXTBOOK · 系统教材 (\${finished}/8)</div>
      <div class="book-sidebar-progress"><span style="width:\${finished*12.5}%"></span></div>
      <button type="button" class="chapter-button \${activeLesson===null?'active':''}" data-book-open="">
        <span class="chapter-no">⌂</span>
        <span class="chapter-meta"><strong>教材概览</strong><small>8 篇深度原创体系</small></span>
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
      <div class="side-overline">TRAINING · 16 天集训大纲</div>
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
      <div class="side-footer">
        <button type="button" class="side-link-btn" data-action="tr-wrong">📝 培训错题复练 (\${trPending().length})</button>
      </div>\`;
  }else if(ui.tab==='projects'){
    const projects=(typeof ProjectLab!=='undefined'&&ProjectLab.getProjects)?ProjectLab.getProjects():[];
    const selected=(typeof ProjectLab!=='undefined'&&ProjectLab.getSelected)?ProjectLab.getSelected():null;
    const flags=(typeof ProjectLab!=='undefined'&&ProjectLab.getProgress)?ProjectLab.getProgress():{};
    panel.innerHTML=\`
      <div class="side-overline">PROJECTS · 4 大实战项目</div>
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
      <div class="side-footer">
        <button type="button" class="side-link-btn" data-project="export-all">导出全部项目成果 JSON</button>
      </div>\`;
  }else if(['review','lab','mission','wrong'].includes(ui.tab)){
    panel.innerHTML=\`
      <div class="side-overline">PRACTICE · 练习与复习</div>
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
    const tbDone=(typeof Textbook!=='undefined'&&Textbook.getProgress&&Textbook.getProgress())?Textbook.getProgress().completed:0;
    const projDone=(typeof ProjectLab!=='undefined'&&ProjectLab.getProgress)?Object.values(ProjectLab.getProgress()).filter(Boolean).length:0;
    panel.innerHTML=\`
      <div class="side-overline">OVERVIEW · 学习概览</div>
      <div class="side-home-stats">
        <div><span>基础六章</span><strong>\${mastered} / 6 达标</strong></div>
        <div><span>系统教材</span><strong>\${tbDone} / 8 篇已读</strong></div>
        <div><span>实战项目</span><strong>\${projDone} / 4 项达标</strong></div>
        <div><span>待复习卡</span><strong>\${due} 张到期</strong></div>
        <div><span>错题巩固</span><strong>\${wrong} 道待练</strong></div>
      </div>
      <div class="side-footer">
        <button type="button" data-action="clear">重置基础学习记录</button>
      </div>\`;
  }
}

function updateMobileSubbar(){
  const titleEl=$('mobileCurrentTitle'),metaEl=$('mobileCurrentMeta');
  if(!titleEl)return;
  if(ui.tab==='home'){
    titleEl.textContent='学习首页';if(metaEl)metaEl.textContent='概览与推荐';
  }else if(ui.tab==='textbook'){
    const active=(typeof Textbook!=='undefined'&&Textbook.getActive)?Textbook.getActive():null;
    const manifest=(typeof Textbook!=='undefined'&&Textbook.getManifest)?Textbook.getManifest():null;
    const lesson=manifest?manifest.lessons.find(l=>l.id===active):null;
    titleEl.textContent=lesson?\`教材 · \${lesson.title}\`:'系统教材大纲';
    if(metaEl)metaEl.textContent=lesson?\`建议 \${lesson.mins} 分钟\`:'8 篇';
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

function render(){
  const isHome=ui.tab==='home';
  const heroBox=$('homeHeroArea');
  if(heroBox)heroBox.style.display=isHome?'block':'none';

  $('mainContent').classList.toggle('feedback-mode',ui.tab==='feedback');
  document.querySelectorAll('[data-action="nav-feedback"]').forEach(b=>b.classList.toggle('active',ui.tab==='feedback'));

  // Update primary navigation tabs
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
    return \`<div class="quiz-result"><div class="score-ring" style="border-color:\${pass?'#dff5ee':'#fee2e2'};color:\${pass?'var(--teal)':'var(--red)'}">\${pct}%</div><h3>\${pass?'练习达标！':'继续加油'}</h3><p>本次作答 \${total} 题，答对 \${correct} 题。答错题目已加入错题本。\${pass?'已记录达标状态。':'正确率满 70% 即可达标。'}</p><div class="review">\${ui.quizItems.map((id,i)=>{
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

const finalHtml = part1 + courseData + part3 + '\n</script>\n</body>\n</html>\n';
fs.writeFileSync(indexPath, finalHtml, 'utf8');
console.log('SUCCESS: index.html has been overhauled and written. Size:', finalHtml.length);
