import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { Plus, Search, ArrowRight, ArrowUp, ArrowDown, Edit2, Trash2, Save, X, Check, Star, Copy, Share2, Settings, Download, Upload, FileText, Tag, Database, RefreshCw, Cloud, LogOut, Type, Eye, EyeOff, Sun, Moon, Monitor, RotateCcw, WifiOff, ChevronLeft, ListChecks, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- Firebase Configuration ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAyduZJV4ShlLFRSgjik7RX8bwxPnAVn_0",
  authDomain: "recipe-book-83c89.firebaseapp.com",
  databaseURL: "https://recipe-book-83c89.firebaseio.com",
  projectId: "recipe-book-83c89",
  storageBucket: "recipe-book-83c89.appspot.com",
  messagingSenderId: "455704276627",
  appId: "1:455704276627:web:38a9fd87d9ac9ece11e766"
};

const TEST_DB_ID = "giyGyr4ALAPNLvLybbEOPXyHDMv2";
const PROD_DB_ID = "FgETS4BeELaIGQ3QziwnDCqDQUx2";
const DEFAULT_CATEGORIES = ['עיקריות', 'חלבי', 'תוספות', 'סלטים', 'מאפים', 'קינוחים', 'ארוחת בוקר', 'משקאות', 'שונות'];
const DEFAULT_CATEGORY = 'שונות';
const FAV = '__fav';

let db = null;
let auth = null;
try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) { console.error("Firebase init error:", e); }

// --- Design system: one ground, one ink, one accent, light + dark ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@400;500;700&display=swap');
    :root{--bg:#f4eee2;--s1:#fbf8f1;--s2:#ebe3d3;--ink:#1f1a14;--mute:#6a6154;--acc:#b8400d;--acc-ink:#fff;--bad:#b42318;--line:rgba(31,26,20,.12);color-scheme:light}
    @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15110d;--s1:#1e1914;--s2:#2a231c;--ink:#f3ebdd;--mute:#a59b8b;--acc:#f0773a;--acc-ink:#1a0e05;--bad:#f0746b;--line:rgba(243,235,221,.12);color-scheme:dark}}
    :root[data-theme="dark"]{--bg:#15110d;--s1:#1e1914;--s2:#2a231c;--ink:#f3ebdd;--mute:#a59b8b;--acc:#f0773a;--acc-ink:#1a0e05;--bad:#f0746b;--line:rgba(243,235,221,.12);color-scheme:dark}
    *{-webkit-tap-highlight-color:transparent}
    body{margin:0;font-family:'Heebo',system-ui,sans-serif;background:var(--bg);color:var(--ink);overscroll-behavior-y:none;overflow-x:hidden}
    .serif{font-family:'Frank Ruhl Libre',serif}
    .app{min-height:100vh;background:var(--bg);color:var(--ink)}
    .wrap{max-width:64rem;margin:0 auto;padding:0 16px}
    .hd{position:sticky;top:0;z-index:30;background:var(--bg);padding-top:env(safe-area-inset-top,0px);border-bottom:1px solid var(--line)}
    .mute{color:var(--mute)}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 20px;border-radius:999px;font:500 15px 'Heebo',sans-serif;background:var(--s2);color:var(--ink);border:0;cursor:pointer;transition:transform .15s,opacity .15s}
    .btn:active{transform:scale(.97)}.btn:disabled{opacity:.4;cursor:default}
    .btn-p{background:var(--acc);color:var(--acc-ink);font-weight:700}
    .btn-d{background:var(--bad);color:#fff;font-weight:700}
    .ico{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;border:0;background:transparent;color:var(--mute);cursor:pointer;transition:background .15s,color .15s;flex-shrink:0}
    .ico:hover{background:var(--s2);color:var(--ink)}.ico.on{color:var(--acc)}.ico:disabled{opacity:.3}
    .fld{width:100%;box-sizing:border-box;background:var(--s1);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:14px 16px;font:400 16px 'Heebo',sans-serif;outline:none;transition:border-color .15s}
    .fld:focus{border-color:var(--acc)}.fld.err{border-color:var(--bad)}.fld::placeholder{color:var(--mute);opacity:.7}
    .lbl{display:block;font-size:13px;font-weight:500;color:var(--mute);margin-bottom:8px}
    .card{display:block;width:100%;text-align:right;background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:18px 20px;cursor:pointer;color:inherit;font:inherit;transition:background .15s,transform .15s}
    .card:hover{background:var(--s2)}.card:active{transform:scale(.99)}
    .tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;touch-action:pan-x}.tabs::-webkit-scrollbar{display:none}
    .tab{flex-shrink:0;min-height:44px;padding:0 14px;background:none;border:0;border-bottom:2px solid transparent;color:var(--mute);font:500 15px 'Heebo',sans-serif;cursor:pointer;white-space:nowrap}
    .tab.on{color:var(--ink);border-bottom-color:var(--acc);font-weight:700}
    .chip{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--mute);font:500 14px 'Heebo',sans-serif;cursor:pointer}
    .chip.on{background:var(--acc);border-color:var(--acc);color:var(--acc-ink);font-weight:700}
    .seg{display:flex;background:var(--s2);border-radius:999px;padding:3px}
    .seg button{flex:1;min-height:38px;border:0;border-radius:999px;background:none;color:var(--mute);font:500 14px 'Heebo',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
    .seg button.on{background:var(--s1);color:var(--ink);font-weight:700}
    .row{display:flex;align-items:center;gap:14px;width:100%;min-height:56px;padding:8px 4px;background:none;border:0;border-bottom:1px solid var(--line);color:var(--ink);font:500 15px 'Heebo',sans-serif;text-align:right;cursor:pointer}
    .row small{display:block;color:var(--mute);font-weight:400;font-size:13px}
    .row svg{color:var(--mute);flex-shrink:0}
    .sec{font-size:12px;font-weight:700;color:var(--mute);letter-spacing:.06em;margin:22px 0 4px}
    .letter{font:700 22px 'Frank Ruhl Libre',serif;color:var(--acc);margin:28px 0 10px}
    mark{background:transparent;color:var(--acc);font-weight:900}
    .scrim{position:fixed;inset:0;z-index:60;background:rgba(10,8,5,.6);display:flex;align-items:flex-end;justify-content:center;animation:fade .2s}
    .sheet{background:var(--bg);width:100%;max-width:28rem;max-height:90vh;overflow-y:auto;border-radius:20px 20px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));animation:up .25s cubic-bezier(.2,.8,.2,1);scrollbar-width:none}
    @media(min-width:640px){.scrim{align-items:center}.sheet{border-radius:20px}}
    .toast{position:fixed;z-index:80;left:16px;right:16px;top:calc(12px + env(safe-area-inset-top,0px));margin:0 auto;max-width:26rem;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;background:var(--ink);color:var(--bg);font-size:15px;font-weight:500;animation:down .25s}
    .toast.error{background:var(--bad);color:#fff}.toast button{background:none;border:0;color:inherit;font:700 15px 'Heebo',sans-serif;cursor:pointer;text-decoration:underline}
    .fab{position:fixed;z-index:40;left:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));width:60px;height:60px;border-radius:999px;border:0;background:var(--acc);color:var(--acc-ink);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s}
    .fab:active{transform:scale(.93)}
    .skel{height:96px;border-radius:10px;background:var(--s1);animation:pulse 1.2s ease-in-out infinite}
    .check{display:flex;align-items:flex-start;gap:14px;padding:14px 4px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none;width:100%;background:none;border-left:0;border-right:0;border-top:0;color:inherit;text-align:right;font-family:inherit}
    .box{width:26px;height:26px;border-radius:7px;border:2px solid var(--mute);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all .2s}
    .done .box{background:var(--acc);border-color:var(--acc);color:var(--acc-ink)}.done .txt{opacity:.45;text-decoration:line-through}
    .bar{height:4px;border-radius:4px;background:var(--s2);overflow:hidden}.bar i{display:block;height:100%;background:var(--acc);transition:width .3s}
    .shake{animation:shake .4s both}
    .bar-save{position:sticky;bottom:0;padding:12px 0 calc(12px + env(safe-area-inset-bottom,0px));background:var(--bg)}
    @keyframes fade{from{opacity:0}}@keyframes up{from{transform:translateY(40px);opacity:0}}@keyframes down{from{transform:translateY(-16px);opacity:0}}
    @keyframes pulse{50%{opacity:.5}}@keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
    .enter{animation:up .35s cubic-bezier(.2,.8,.2,1)}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    @media print{.hd,.fab,.noprint,.toast{display:none!important}body,.app{background:#fff!important;color:#000!important}.pr{border:0!important;box-shadow:none!important}}
  `}</style>
);

// --- Helpers ---
const normalizeCategories = (r) => (Array.isArray(r.categories) && r.categories.length ? r.categories : r.category ? [r.category] : [DEFAULT_CATEGORY]);
const FONT_SIZES = {
  normal: { label: 'רגיל', cls: 'text-base md:text-xl' },
  large: { label: 'גדול', cls: 'text-lg md:text-2xl' },
  xl: { label: 'ענק', cls: 'text-3xl md:text-5xl' }
};
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cleanRecipe = (r) => ({
  title: r.title || '', content: r.content || '', categories: r.categories || (r.category ? [r.category] : [DEFAULT_CATEGORY]),
  chef: r.chef || '', favorite: !!r.favorite, createdAt: r.createdAt || r.updatedAt || new Date().toISOString(), updatedAt: r.updatedAt || new Date().toISOString()
});
const parseLines = (content = '') => content.split('\n').map((t) => {
  const s = t.trim();
  if (!s) return { type: 'blank', text: '' };
  if (/[:：]$/.test(s) && s.length < 60) return { type: 'head', text: s.replace(/[:：]$/, '') };
  return { type: 'item', text: s };
});
const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
const recipeText = (r) => `${r.title}\n${r.chef ? `מאת ${r.chef}\n` : ''}(${normalizeCategories(r).join(', ')})\n\n${r.content}`;
const Hi = ({ text, q }) => {
  if (!q.trim()) return text;
  const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.trim().length)}</mark>{text.slice(i + q.trim().length)}</>;
};

// --- Components ---
const Splash = ({ onFinish }) => {
  const [out, setOut] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setOut(true); setTimeout(onFinish, 300); }, 1400); return () => clearTimeout(t); }, [onFinish]);
  return (
    <div onClick={onFinish} className="app" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'opacity .3s', opacity: out ? 0 : 1 }}>
      <h1 className="serif" style={{ fontSize: 56, fontWeight: 900, margin: 0, lineHeight: 1 }}>המתכונים <span style={{ color: 'var(--acc)' }}>שלי</span></h1>
      <p className="mute" style={{ marginTop: 12, fontSize: 18 }}>הספר המשפחתי</p>
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  if (!toast.show) return null;
  return (
    <div className={`toast ${toast.type === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
      {toast.type === 'error' && <AlertCircle size={20} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      {toast.action && <button onClick={() => { toast.action.fn(); onClose(); }}>{toast.action.label}</button>}
      <button onClick={onClose} aria-label="סגור" style={{ textDecoration: 'none', display: 'flex' }}><X size={18} /></button>
    </div>
  );
};

const Sheet = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="sheet" role="dialog" aria-modal="true">{children}</div></div>;
};

const Confirm = ({ title, message, label = 'אישור', danger, onConfirm, onClose }) => (
  <>
    <h3 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>{title}</h3>
    <p className="mute" style={{ margin: '0 0 24px', fontSize: 16, lineHeight: 1.5 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10 }}>
      <button className="btn" style={{ flex: 1 }} onClick={onClose}>ביטול</button>
      <button className={`btn ${danger ? 'btn-d' : 'btn-p'}`} style={{ flex: 1 }} onClick={onConfirm}>{label}</button>
    </div>
  </>
);

const Settings_ = ({ p }) => {
  const [step, setStep] = useState(0);
  const [action, setAction] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [manage, setManage] = useState(false);
  const fileRef = useRef(null);
  const cats = p.categories;

  const steps = [null,
    { e: '👮‍♂️', t: 'בדיקה ביטחונית', m: 'רגע אחד... האם אתה עדי?', y: 'כן, זה אני', n: 'לא, סליחה' },
    { e: '🤨', t: 'וידוא כפול', m: 'אתה בטוח שאתה עדי? זה נראה קצת חשוד...', y: 'כן, זה אני', n: 'לא, סליחה' },
    { e: '😱', t: 'אזהרה חמורה!', m: 'הפעולה הזו עלולה לדרוס את כל המתכונים! האם אתה בטוח?', y: 'כן, אני עדי!', n: 'בורח!' }
  ];
  const next = () => {
    if (step < 3) return setStep(step + 1);
    if (action === 'backup') p.onCloudBackup(); else p.onCloudRestore();
    setStep(0); setAction(null);
  };
  const move = (i, d) => { const c = [...cats]; const j = i + d; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; p.onUpdateCategories(c); };
  const addCat = () => { const v = newCat.trim(); if (v && !cats.includes(v)) { p.onUpdateCategories([...cats, v]); setNewCat(''); } };

  if (step > 0) {
    const s = steps[step];
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>{s.e}</div>
        <h3 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: '8px 0' }}>{s.t}</h3>
        <p className="mute" style={{ fontSize: 16, lineHeight: 1.5 }}>{s.m}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => { setStep(0); setAction(null); }}>{s.n}</button>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={next}>{s.y}</button>
        </div>
      </div>
    );
  }

  if (manage) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button className="ico" onClick={() => setManage(false)} aria-label="חזרה"><ArrowRight size={22} /></button>
        <h3 className="serif" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>קטגוריות</h3>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); addCat(); }} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input className="fld" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה" />
        <button className="btn btn-p" type="submit" aria-label="הוספה"><Plus size={20} /></button>
      </form>
      {cats.map((c, i) => (
        <div key={c} className="row" style={{ cursor: 'default' }}>
          <span style={{ flex: 1 }}>{c}</span>
          <button className="ico" onClick={() => move(i, -1)} disabled={i === 0} aria-label="למעלה"><ArrowUp size={18} /></button>
          <button className="ico" onClick={() => move(i, 1)} disabled={i === cats.length - 1} aria-label="למטה"><ArrowDown size={18} /></button>
          <button className="ico" style={{ color: 'var(--bad)' }} onClick={() => p.onUpdateCategories(cats.filter((_, k) => k !== i))} aria-label="מחיקה"><Trash2 size={18} /></button>
        </div>
      ))}
    </div>
  );

  const themes = [['system', 'אוטומטי', Monitor], ['light', 'בהיר', Sun], ['dark', 'כהה', Moon]];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>הגדרות</h3>
        <button className="ico" onClick={p.onClose} aria-label="סגור"><X size={22} /></button>
      </div>
      {p.isTestEnv && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', margin: '14px 0 0', borderRadius: 10, background: 'var(--s2)', color: 'var(--acc)', fontWeight: 700, fontSize: 14 }}><Database size={18} /> סביבת בדיקה – השינויים נשמרים במסד נפרד</div>}

      <div className="sec">תצוגה</div>
      <div className="seg" style={{ marginBottom: 10 }}>
        {themes.map(([k, l, I]) => <button key={k} className={p.theme === k ? 'on' : ''} onClick={() => p.onTheme(k)}><I size={16} />{l}</button>)}
      </div>
      <div className="seg">
        {Object.entries(FONT_SIZES).map(([k, c]) => <button key={k} className={p.fontSize === k ? 'on' : ''} onClick={() => p.onUpdateFontSize(k)}><Type size={k === 'normal' ? 14 : k === 'large' ? 17 : 20} />{c.label}</button>)}
      </div>

      <div className="sec">ספר המתכונים</div>
      <button className="row" onClick={() => setManage(true)}><Tag size={20} /><span>ניהול קטגוריות<small>עריכת רשימה וסדר</small></span></button>
      <button className="row" onClick={p.onExportWord}><FileText size={20} /><span>הורדה לקובץ Word<small>להדפסה נוחה</small></span></button>
      <button className="row" onClick={p.onFileBackup}><Download size={20} /><span>שמירת גיבוי למכשיר<small>קובץ JSON</small></span></button>
      <button className="row" onClick={() => fileRef.current?.click()}><Upload size={20} /><span>שחזור מקובץ גיבוי<small>קובץ JSON מהמכשיר</small></span></button>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) p.onFileRestore(f); }} />

      <div className="sec">ענן</div>
      <button className="row" onClick={() => { setAction('backup'); setStep(1); }}><RefreshCw size={20} /><span>יצירת גיבוי מלא<small>שומר תמונת מצב בענן</small></span></button>
      <button className="row" onClick={() => { setAction('restore'); setStep(1); }}><Cloud size={20} /><span>שחזור מגיבוי ענן<small>דורס מתכונים עם אותו מזהה</small></span></button>

      <button className="row" style={{ marginTop: 18, borderBottom: 0, color: 'var(--bad)' }} onClick={p.onLogout}><LogOut size={20} style={{ color: 'var(--bad)' }} /><span>התנתקות</span></button>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const submit = (e) => {
    e.preventDefault();
    const v = pw.trim();
    if (v === 'קובי') onLogin(PROD_DB_ID, 'prod');
    else if (v === 'טסט') onLogin(TEST_DB_ID, 'test');
    else { setError(true); setAttempts((a) => a + 1); setTimeout(() => setError(false), 500); }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="enter" style={{ width: '100%', maxWidth: 380 }}>
        <h1 className="serif" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, margin: '0 0 8px' }}>המתכונים <span style={{ color: 'var(--acc)' }}>שלי</span></h1>
        <p className="mute" style={{ fontSize: 18, margin: '0 0 32px' }}>הספר המשפחתי. הכניסו סיסמה כדי להמשיך.</p>
        <form onSubmit={submit}>
          <label className="lbl" htmlFor="pw">סיסמה</label>
          <div style={{ position: 'relative' }} className={error ? 'shake' : ''}>
            <input id="pw" className={`fld ${error ? 'err' : ''}`} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="off" style={{ paddingLeft: 52 }} />
            <button type="button" className="ico" onClick={() => setShow(!show)} aria-label={show ? 'הסתרת סיסמה' : 'הצגת סיסמה'} style={{ position: 'absolute', left: 4, top: 2 }}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>
          <div style={{ minHeight: 24, margin: '8px 0', color: 'var(--bad)', fontSize: 14 }} role="alert">{error ? 'סיסמה שגויה, נסו שוב' : ''}</div>
          <button className="btn btn-p" type="submit" style={{ width: '100%', minHeight: 52, fontSize: 17 }}>כניסה</button>
        </form>
        {attempts >= 3 && <p className="mute" style={{ marginTop: 24, fontSize: 14, lineHeight: 1.6 }}>רמז: לסביבת הטסט הזינו "טסט". לחשבון המשפחתי הזינו את שם המשפחה.</p>}
      </div>
    </div>
  );
};

const Linkified = ({ text }) => {
  const parts = (text || '').split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((p, i) => /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc)', textDecoration: 'underline', textUnderlineOffset: 4, wordBreak: 'break-all' }} onClick={(e) => e.stopPropagation()}>{p}</a> : p)}</>;
};

const ReadView = ({ content, cls }) => (
  <div className={`${cls} enter`} style={{ lineHeight: 1.7 }}>
    {parseLines(content).map((l, i) => l.type === 'blank' ? <div key={i} style={{ height: '.8em' }} /> : l.type === 'head'
      ? <h3 key={i} className="serif" style={{ fontWeight: 900, fontSize: '1.3em', margin: '1.2em 0 .3em' }}>{l.text}</h3>
      : <p key={i} style={{ margin: 0, overflowWrap: 'anywhere' }}><Linkified text={l.text} /></p>)}
  </div>
);

const Checklist = ({ recipe, cls }) => {
  const key = `chk_${recipe.id}`;
  const [done, setDone] = useState(() => { try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; } });
  const lines = useMemo(() => parseLines(recipe.content), [recipe.content]);
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(done)); } catch { /* ignore */ } }, [done, key]);
  const items = lines.map((l, i) => ({ ...l, i })).filter((l) => l.type === 'item');
  const count = items.filter((l) => done[l.i]).length;
  return (
    <div className="enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="bar" style={{ flex: 1 }}><i style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }} /></div>
        <span className="mute" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{count}/{items.length}</span>
        <button className="ico" onClick={() => setDone({})} aria-label="איפוס" style={{ width: 36, height: 36 }}><RotateCcw size={18} /></button>
      </div>
      {lines.map((l, i) => l.type === 'blank' ? <div key={i} style={{ height: 12 }} /> : l.type === 'head'
        ? <h3 key={i} className="serif" style={{ fontWeight: 900, fontSize: '1.4rem', margin: '20px 0 4px' }}>{l.text}</h3>
        : <button key={i} className={`check ${done[i] ? 'done' : ''}`} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} aria-pressed={!!done[i]}>
            <span className="box">{done[i] && <Check size={18} strokeWidth={3} />}</span>
            <span className={`txt ${cls}`} style={{ flex: 1, lineHeight: 1.5, overflowWrap: 'anywhere' }}><Linkified text={l.text} /></span>
          </button>)}
    </div>
  );
};

const CategoryTabs = ({ categories, selected, onSelect, counts }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; const b = el?.querySelector(`[data-c="${CSS.escape(selected)}"]`);
    if (b) el.scrollTo({ left: b.offsetLeft - el.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' });
  }, [selected]);
  const all = [['הכל', 'הכל'], [FAV, '★ מועדפים'], ...categories.map((c) => [c, c])];
  return (
    <div className="hd" style={{ top: 'calc(var(--hdh,0px))', borderTop: 0, zIndex: 20, position: 'static' }}>
      <div className="wrap"><div ref={ref} className="tabs">
        {all.map(([k, l]) => <button key={k} data-c={k} className={`tab ${selected === k ? 'on' : ''}`} onClick={() => onSelect(k)}>{l}{counts[k] ? <span className="mute" style={{ marginRight: 6, fontSize: 12, fontWeight: 400 }}>{counts[k]}</span> : null}</button>)}
      </div></div>
    </div>
  );
};

const RecipeForm = ({ initialData, onSave, allCategories, onAddCategory, toast }) => {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [chef, setChef] = useState(initialData.chef || '');
  const [sel, setSel] = useState(initialData.id ? normalizeCategories(initialData) : initialData.categories || []);
  const [errors, setErrors] = useState({});
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (c) => setSel((p) => p.includes(c) ? p.filter((x) => x !== c) : p.length >= 2 ? p : [...p, c]);
  const addCat = (e) => { e.preventDefault(); const v = newCat.trim(); if (!v) return; onAddCategory(v); if (sel.length < 2 && !sel.includes(v)) setSel((p) => [...p, v]); setNewCat(''); setAdding(false); };
  const submit = async (e) => {
    e.preventDefault();
    const er = {}; if (!title.trim()) er.title = 1; if (!content.trim()) er.content = 1;
    if (Object.keys(er).length) { setErrors(er); toast('נא למלא כותרת והוראות', 'error'); return; }
    setBusy(true);
    await onSave({ ...initialData, title: title.trim(), content, chef: chef.trim(), categories: sel.length ? sel : [DEFAULT_CATEGORY] });
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="wrap enter" style={{ maxWidth: '44rem', paddingTop: 20, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ marginBottom: 20 }}>
        <label className="lbl" htmlFor="t">שם המתכון</label>
        <input id="t" className={`fld serif ${errors.title ? 'err' : ''}`} style={{ fontSize: 24, fontWeight: 700 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הפסטה של סבתא" autoFocus={!initialData.id} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label className="lbl" htmlFor="c">מי הכין? (לא חובה)</label>
        <input id="c" className="fld" value={chef} onChange={(e) => setChef(e.target.value)} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <span className="lbl">קטגוריות (עד 2)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allCategories.map((c) => <button type="button" key={c} className={`chip ${sel.includes(c) ? 'on' : ''}`} onClick={() => toggle(c)}>{c}</button>)}
          {!adding ? <button type="button" className="chip" onClick={() => setAdding(true)} style={{ borderStyle: 'dashed' }}>+ חדשה</button> : (
            <span style={{ display: 'flex', gap: 6, width: '100%' }}>
              <input className="fld" style={{ padding: '8px 12px' }} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="שם הקטגוריה" autoFocus onKeyDown={(e) => e.key === 'Enter' && addCat(e)} />
              <button type="button" className="ico" onClick={addCat} aria-label="הוספה"><Check size={20} /></button>
              <button type="button" className="ico" onClick={() => setAdding(false)} aria-label="ביטול"><X size={20} /></button>
            </span>
          )}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <label className="lbl" htmlFor="b">מצרכים והוראות</label>
        <textarea id="b" className={`fld ${errors.content ? 'err' : ''}`} style={{ flex: 1, minHeight: 320, lineHeight: 1.7, resize: 'vertical' }} value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={'מצרכים:\n2 כוסות קמח\n3 ביצים\n\nהכנה:\nמערבבים הכול ואופים 30 דקות'} />
      </div>
      <div className="bar-save"><button type="submit" disabled={busy} className="btn btn-p" style={{ width: '100%', minHeight: 54, fontSize: 17 }}><Save size={20} />{busy ? 'שומר...' : 'שמירה'}</button></div>
    </form>
  );
};

const RecipeDetail = ({ recipe, fontSize, onFont, onShare, onCopy, onFav }) => {
  const [mode, setMode] = useState('read');
  const cls = FONT_SIZES[fontSize]?.cls || FONT_SIZES.normal.cls;
  const sizes = Object.keys(FONT_SIZES); const idx = sizes.indexOf(fontSize);
  return (
    <article className="wrap enter pr" style={{ maxWidth: '44rem', paddingTop: 24, paddingBottom: 96 }}>
      <h2 className="serif" style={{ fontSize: 'clamp(34px,7vw,54px)', fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: '-.02em', textWrap: 'balance' }}>{recipe.title}</h2>
      <p className="mute" style={{ margin: '12px 0 0', fontSize: 16 }}>{[...(recipe.chef ? [`מאת ${recipe.chef}`] : []), normalizeCategories(recipe).join(' · ')].join(' — ')}</p>
      <div className="noprint" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '20px 0', flexWrap: 'wrap' }}>
        <div className="seg" style={{ minWidth: 220 }}>
          <button className={mode === 'read' ? 'on' : ''} onClick={() => setMode('read')}>קריאה</button>
          <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}><ListChecks size={16} />צ׳ק-ליסט</button>
        </div>
        <span style={{ flex: 1 }} />
        <button className="ico" onClick={() => onFont(sizes[Math.max(0, idx - 1)])} disabled={idx === 0} aria-label="הקטנת טקסט"><span style={{ fontWeight: 700, fontSize: 14 }}>א-</span></button>
        <button className="ico" onClick={() => onFont(sizes[Math.min(sizes.length - 1, idx + 1)])} disabled={idx === sizes.length - 1} aria-label="הגדלת טקסט"><span style={{ fontWeight: 700, fontSize: 20 }}>א+</span></button>
        <button className="ico" onClick={onCopy} aria-label="העתקה"><Copy size={20} /></button>
        <button className="ico" onClick={onShare} aria-label="שיתוף"><Share2 size={20} /></button>
        <button className={`ico ${recipe.favorite ? 'on' : ''}`} onClick={onFav} aria-label="מועדף" aria-pressed={!!recipe.favorite}><Star size={22} fill={recipe.favorite ? 'currentColor' : 'none'} /></button>
      </div>
      {mode === 'read' ? <ReadView content={recipe.content} cls={cls} /> : <Checklist recipe={recipe} cls={cls} />}
    </article>
  );
};

const RecipeCard = ({ r, q, onOpen, onFav }) => (
  <div style={{ position: 'relative' }}>
    <button className="card" onClick={onOpen} style={{ paddingLeft: 56 }}>
      <div className="mute" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{normalizeCategories(r).join(' · ')}{r.chef ? ` — ${r.chef}` : ''}</div>
      <h3 className="serif" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, margin: 0 }}><Hi text={r.title || ''} q={q} /></h3>
      <p className="mute" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.content}</p>
      <ChevronLeft size={20} className="mute" style={{ position: 'absolute', left: 16, bottom: 18 }} />
    </button>
    <button className={`ico ${r.favorite ? 'on' : ''}`} onClick={onFav} aria-label="מועדף" aria-pressed={!!r.favorite} style={{ position: 'absolute', left: 6, top: 6 }}><Star size={20} fill={r.favorite ? 'currentColor' : 'none'} /></button>
  </div>
);

// --- Main App ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [dbId, setDbId] = useState(null);
  const [envMode, setEnvMode] = useState('');
  const [view, setView] = useState('list');
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: null, data: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([...DEFAULT_CATEGORIES]);
  const [fontSize, setFontSize] = useState('normal');
  const [theme, setTheme] = useState('system');
  const [sort, setSort] = useState('az');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const scrollPosRef = useRef(0);
  const toastTimer = useRef(null);
  const deletedRef = useRef(null);

  const showToast = (message, type = 'success', action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, message, type, action });
    toastTimer.current = setTimeout(() => setToast((p) => ({ ...p, show: false })), action ? 7000 : 3000);
  };
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  // Local settings + auto login
  useEffect(() => {
    document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl';
    const id = localStorage.getItem('recipe_db_id'); const mode = localStorage.getItem('recipe_env_mode');
    if (id && mode) handleLogin(id, mode, true);
    const fs = localStorage.getItem('recipe_app_font_size'); if (fs && FONT_SIZES[fs]) setFontSize(fs);
    const th = localStorage.getItem('recipe_theme'); if (th) setTheme(th);
    const so = localStorage.getItem('recipe_sort'); if (so) setSort(so);
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
  }, [theme]);

  const updateFontSize = (v) => { setFontSize(v); localStorage.setItem('recipe_app_font_size', v); };
  const updateTheme = (v) => { setTheme(v); localStorage.setItem('recipe_theme', v); };
  const updateSort = (v) => { setSort(v); localStorage.setItem('recipe_sort', v); };

  const settingsRef = () => doc(db, 'notes', dbId, 'settings', 'appSettings');
  const saveCategoriesToDb = async (cats) => {
    if (!db || !dbId) return;
    try { await setDoc(settingsRef(), { categories: cats }, { merge: true }); } catch (e) { console.error('Error saving categories:', e); }
  };

  // Anonymous auth first, then subscriptions
  useEffect(() => {
    if (!isAuthenticated || !auth) return;
    let alive = true;
    (async () => {
      try { if (!auth.currentUser) await signInAnonymously(auth); } catch (e) { console.error('Auth error', e); showToast('שגיאת התחברות לשרת', 'error'); }
      if (alive) setAuthReady(true);
    })();
    return () => { alive = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!db || !dbId || !authReady) return;
    return onSnapshot(settingsRef(), (s) => { if (s.exists() && s.data().categories) setAllCategories(s.data().categories); });
  }, [dbId, authReady]);

  useEffect(() => {
    if (!isAuthenticated || !db || !dbId || !authReady) return;
    setLoading(true);
    return onSnapshot(query(collection(db, 'notes', dbId, 'myNotes')),
      (snap) => { setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e) => { console.error('Error fetching recipes:', e); showToast('שגיאה בטעינת נתונים', 'error'); setLoading(false); });
  }, [isAuthenticated, dbId, authReady]);

  // Add categories found on recipes
  useEffect(() => {
    if (!recipes.length) return;
    const cur = [...allCategories]; let changed = false;
    recipes.forEach((r) => normalizeCategories(r).forEach((c) => { if (!cur.includes(c)) { cur.push(c); changed = true; } }));
    if (changed) { setAllCategories(cur); saveCategoriesToDb(cur); }
  }, [recipes, dbId]);

  useLayoutEffect(() => { window.scrollTo(0, view === 'list' ? scrollPosRef.current : 0); }, [view]);

  const handleLogin = (id, mode, auto = false) => {
    localStorage.setItem('recipe_db_id', id); localStorage.setItem('recipe_env_mode', mode);
    setDbId(id); setEnvMode(mode); setIsAuthenticated(true);
    if (!auto) showToast(mode === 'test' ? 'נכנסתם למצב בדיקה 🧪' : 'ברוכים הבאים למשפחה! 👨‍🍳');
  };
  const handleLogout = () => {
    localStorage.removeItem('recipe_db_id'); localStorage.removeItem('recipe_env_mode');
    setIsAuthenticated(false); setAuthReady(false); setDbId(null); setEnvMode(''); setRecipes([]); setView('list');
    setModal((p) => ({ ...p, isOpen: false })); showToast('התנתקתם בהצלחה 👋', 'info');
  };

  const handleAddCategory = (name) => {
    const v = name.trim(); if (!v) return;
    if (allCategories.includes(v)) { showToast('הקטגוריה כבר קיימת', 'error'); return; }
    const u = [...allCategories, v]; setAllCategories(u); saveCategoriesToDb(u); showToast('קטגוריה נוספה');
  };
  const handleUpdateCategories = (c) => { setAllCategories(c); saveCategoriesToDb(c); };

  const handleSave = async (r) => {
    if (!db || !dbId) return;
    try {
      const now = new Date().toISOString();
      const data = { title: r.title, content: r.content, categories: r.categories || [DEFAULT_CATEGORY], chef: r.chef || '', favorite: !!r.favorite, updatedAt: now };
      if (r.id) await updateDoc(doc(db, 'notes', dbId, 'myNotes', r.id), data);
      else await addDoc(collection(db, 'notes', dbId, 'myNotes'), { ...data, createdAt: now });
      showToast('המתכון נשמר 😋'); setView('list'); setActiveRecipe(null);
    } catch (e) { console.error('Save error', e); showToast('שגיאה בשמירת המתכון', 'error'); }
  };

  const toggleFav = async (r) => {
    try { await updateDoc(doc(db, 'notes', dbId, 'myNotes', r.id), { favorite: !r.favorite }); if (activeRecipe?.id === r.id) setActiveRecipe({ ...activeRecipe, favorite: !r.favorite }); }
    catch (e) { console.error(e); showToast('שגיאה בעדכון מועדפים', 'error'); }
  };

  const confirmDelete = async () => {
    const id = modal.data; const r = recipes.find((x) => x.id === id);
    if (!db || !dbId || !id) return;
    try {
      await deleteDoc(doc(db, 'notes', dbId, 'myNotes', id));
      deletedRef.current = r;
      if (activeRecipe?.id === id) { setView('list'); setActiveRecipe(null); }
      setModal((p) => ({ ...p, isOpen: false }));
      showToast('המתכון נמחק', 'info', r && { label: 'ביטול', fn: async () => { const { id: rid, ...rest } = r; try { await setDoc(doc(db, 'notes', dbId, 'myNotes', rid), rest); showToast('המתכון שוחזר'); } catch { showToast('השחזור נכשל', 'error'); } } });
    } catch (e) { console.error('Delete error', e); showToast('שגיאה במחיקת המתכון', 'error'); }
  };

  const writeAll = async (list) => {
    let n = 0;
    for (let i = 0; i < list.length; i += 400) {
      const batch = writeBatch(db);
      list.slice(i, i + 400).forEach((r) => {
        const ref = r.id ? doc(db, 'notes', dbId, 'myNotes', r.id) : doc(collection(db, 'notes', dbId, 'myNotes'));
        batch.set(ref, cleanRecipe(r)); n++;
      });
      await batch.commit();
    }
    return n;
  };

  const handleCloudBackup = async () => {
    if (!db || !dbId) return;
    try {
      showToast('יוצר גיבוי בענן...', 'info');
      await setDoc(doc(db, 'notes', dbId, 'backups', 'latest'), { recipes, categories: allCategories, savedAt: new Date().toISOString(), version: 2 });
      showToast('גיבוי הענן נוצר ☁️');
    } catch (e) { console.error(e); showToast('שגיאה ביצירת גיבוי', 'error'); }
  };
  const handleCloudRestore = async () => {
    if (!db || !dbId) return;
    try {
      showToast('מחפש גיבוי בענן...', 'info');
      const snap = await getDoc(doc(db, 'notes', dbId, 'backups', 'latest'));
      if (!snap.exists()) return showToast('לא נמצא גיבוי בענן', 'error');
      const data = snap.data(); const list = data.recipes || [];
      if (!list.length) return showToast('הגיבוי ריק ממתכונים', 'error');
      const n = await writeAll(list);
      if (data.categories) { setAllCategories(data.categories); saveCategoriesToDb(data.categories); }
      setModal((p) => ({ ...p, isOpen: false })); showToast(`שוחזרו ${n} מתכונים מהענן`);
    } catch (e) { console.error(e); showToast('שגיאה בשחזור מהענן', 'error'); }
  };
  const handleFileBackup = () => {
    download(new Blob([JSON.stringify({ recipes, categories: allCategories }, null, 2)], { type: 'application/json' }), `backup_${envMode}_${new Date().toISOString().slice(0, 10)}.json`);
  };
  const handleFileRestore = (file) => setModal({ isOpen: true, type: 'restoreFile', data: file });
  const confirmFileRestore = () => {
    const file = modal.data; setModal((p) => ({ ...p, isOpen: false }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result); const list = Array.isArray(data.recipes) ? data.recipes.filter((r) => r && r.title && r.content) : [];
        if (!list.length) return showToast('לא נמצאו מתכונים תקינים בקובץ', 'error');
        showToast(`משחזר ${list.length} מתכונים...`, 'info');
        const n = await writeAll(list);
        if (Array.isArray(data.categories)) { setAllCategories(data.categories); saveCategoriesToDb(data.categories); }
        showToast(`שוחזרו ${n} מתכונים`);
      } catch (err) { console.error(err); showToast('שגיאה בקריאת קובץ הגיבוי', 'error'); }
    };
    reader.readAsText(file);
  };

  const handleExportWord = () => {
    try {
      const body = [...recipes].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'he')).map((r) =>
        `<div class="recipe"><h2>${esc(r.title)}</h2><div class="meta">קטגוריות: ${esc(normalizeCategories(r).join(', '))}${r.chef ? ` | שף: ${esc(r.chef)}` : ''}</div><div class="content">${esc(r.content).replace(/\n/g, '<br>')}</div></div>`).join('');
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>ספר מתכונים</title><style>body{font-family:Arial,sans-serif;direction:rtl;text-align:right}h1{text-align:center;color:#b8400d;font-size:24pt}.recipe{border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:30px;page-break-inside:avoid}h2{font-size:18pt;margin-bottom:10px}.meta{color:#666;font-size:10pt;margin-bottom:15px}.content{font-size:12pt;line-height:1.6}</style></head><body><h1>ספר המתכונים שלי</h1>${body}</body></html>`;
      download(new Blob(['\ufeff', html], { type: 'application/msword' }), 'ספר_מתכונים_מלא.doc');
      showToast('קובץ Word מוכן להורדה');
    } catch (e) { console.error(e); showToast('שגיאה ביצירת הקובץ', 'error'); }
  };

  const handleShare = async (r) => {
    const text = recipeText(r);
    if (navigator.share) { try { await navigator.share({ title: r.title, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    window.location.href = `mailto:?subject=${encodeURIComponent(`מתכון: ${r.title}`)}&body=${encodeURIComponent(`${text}\n\nנשלח מאפליקציית המתכונים שלי`)}`;
  };
  const handleCopy = async (r) => {
    try { await navigator.clipboard.writeText(recipeText(r)); showToast('המתכון הועתק'); } catch { showToast('ההעתקה נכשלה', 'error'); }
  };

  const closeModal = () => setModal((p) => ({ ...p, isOpen: false }));
  const startEdit = (r) => { setActiveRecipe(r); setView('edit'); };
  const startCreate = () => { scrollPosRef.current = window.scrollY; setActiveRecipe({ title: '', content: '', categories: [], chef: '' }); setView('create'); };
  const viewRecipe = (r) => { scrollPosRef.current = window.scrollY; setActiveRecipe(r); setView('view'); };
  const goBack = () => { setView('list'); setActiveRecipe(null); };

  // Keep the open recipe in sync with live data
  const liveActive = view === 'view' && activeRecipe ? recipes.find((r) => r.id === activeRecipe.id) || activeRecipe : activeRecipe;

  const counts = useMemo(() => {
    const c = { 'הכל': recipes.length, [FAV]: recipes.filter((r) => r.favorite).length };
    recipes.forEach((r) => normalizeCategories(r).forEach((k) => { c[k] = (c[k] || 0) + 1; }));
    return c;
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = recipes.filter((r) => {
      const hit = !q || [r.title, r.content, r.chef, ...normalizeCategories(r)].some((s) => (s || '').toLowerCase().includes(q));
      if (!hit) return false;
      if (selectedCategory === 'הכל') return true;
      if (selectedCategory === FAV) return !!r.favorite;
      return normalizeCategories(r).includes(selectedCategory);
    });
    return list.sort((a, b) => {
      if (q) { const x = (a.title || '').toLowerCase().includes(q), y = (b.title || '').toLowerCase().includes(q); if (x !== y) return x ? -1 : 1; }
      if (sort === 'new') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      return (a.title || '').localeCompare(b.title || '', 'he');
    });
  }, [recipes, searchQuery, selectedCategory, sort]);

  const grouped = sort === 'az' && !searchQuery.trim();
  let lastLetter = '';

  const header = (
    <header className="hd">
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 64 }}>
        {view === 'list' ? (
          <>
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 900, margin: 0, whiteSpace: 'nowrap' }}>המתכונים <span style={{ color: 'var(--acc)' }}>שלי</span></h1>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360, marginRight: 'auto' }}>
              <Search size={18} className="mute" style={{ position: 'absolute', right: 14, top: 14 }} />
              <input className="fld" style={{ borderRadius: 999, padding: '10px 42px 10px 38px' }} type="search" placeholder="חיפוש מתכון" aria-label="חיפוש" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="ico" aria-label="ניקוי חיפוש" onClick={() => setSearchQuery('')} style={{ position: 'absolute', left: 0, top: 0, width: 42, height: 44 }}><X size={16} /></button>}
            </div>
            <button className="ico" onClick={() => setModal({ isOpen: true, type: 'settings', data: null })} aria-label="הגדרות"><Settings size={22} /></button>
          </>
        ) : (
          <>
            <button className="ico" onClick={goBack} aria-label="חזרה"><ArrowRight size={24} /></button>
            <h1 className="serif" style={{ fontSize: 22, fontWeight: 700, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{view === 'create' ? 'מתכון חדש' : view === 'edit' ? 'עריכת מתכון' : ''}</h1>
            {view === 'view' && <>
              <span style={{ flex: 1 }} />
              <button className="ico" onClick={() => startEdit(liveActive)} aria-label="עריכה"><Edit2 size={20} /></button>
              <button className="ico" onClick={() => setModal({ isOpen: true, type: 'delete', data: liveActive.id })} aria-label="מחיקה"><Trash2 size={20} /></button>
            </>}
          </>
        )}
      </div>
      {!online && <div style={{ background: 'var(--s2)', fontSize: 13, padding: '6px 16px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}><WifiOff size={14} /> אין חיבור לאינטרנט – שינויים יסונכרנו כשהחיבור יחזור</div>}
    </header>
  );

  if (showSplash) return <><GlobalStyles /><Splash onFinish={() => setShowSplash(false)} /></>;
  if (!isAuthenticated) return <div className="app" dir="rtl"><GlobalStyles /><LoginScreen onLogin={handleLogin} /><Toast toast={toast} onClose={closeToast} /></div>;

  return (
    <div className="app" dir="rtl">
      <GlobalStyles />
      {header}
      <main>
        {view === 'list' && (
          <>
            <CategoryTabs categories={allCategories} selected={selectedCategory} onSelect={setSelectedCategory} counts={counts} />
            <div className="wrap enter" style={{ paddingTop: 16, paddingBottom: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span className="mute" style={{ fontSize: 14 }}>{loading ? '' : `${filtered.length} מתכונים`}</span>
                <div className="seg" style={{ width: 180 }}>
                  <button className={sort === 'az' ? 'on' : ''} onClick={() => updateSort('az')}>א–ת</button>
                  <button className={sort === 'new' ? 'on' : ''} onClick={() => updateSort('new')}>אחרונים</button>
                </div>
              </div>
              {loading ? (
                <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="skel" />)}</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '72px 16px' }}>
                  <h2 className="serif" style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>{recipes.length === 0 ? 'הספר עדיין ריק' : 'לא נמצאו מתכונים'}</h2>
                  <p className="mute" style={{ margin: '0 0 24px', fontSize: 16 }}>{recipes.length === 0 ? 'הוסיפו את המתכון הראשון של המשפחה.' : selectedCategory === FAV ? 'סמנו מתכון בכוכב כדי למצוא אותו כאן.' : 'נסו חיפוש אחר או קטגוריה אחרת.'}</p>
                  {recipes.length === 0
                    ? <button className="btn btn-p" onClick={startCreate}><Plus size={20} />מתכון חדש</button>
                    : <button className="btn" onClick={() => { setSearchQuery(''); setSelectedCategory('הכל'); }}>ניקוי סינון</button>}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12, marginTop: grouped ? 0 : 20, gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>
                  {filtered.map((r) => {
                    const L = grouped ? (r.title || '?').trim().charAt(0) : ''; const head = grouped && L !== lastLetter; lastLetter = L;
                    return (
                      <React.Fragment key={r.id}>
                        {head && <div className="letter" style={{ gridColumn: '1 / -1' }}>{L}</div>}
                        <RecipeCard r={r} q={searchQuery} onOpen={() => viewRecipe(r)} onFav={() => toggleFav(r)} />
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        {view === 'view' && liveActive && <RecipeDetail recipe={liveActive} fontSize={fontSize} onFont={updateFontSize} onShare={() => handleShare(liveActive)} onCopy={() => handleCopy(liveActive)} onFav={() => toggleFav(liveActive)} />}
        {(view === 'edit' || view === 'create') && activeRecipe && <RecipeForm key={activeRecipe.id || 'new'} initialData={activeRecipe} onSave={handleSave} allCategories={allCategories} onAddCategory={handleAddCategory} toast={showToast} />}
      </main>

      {view === 'list' && <button className="fab" onClick={startCreate} aria-label="מתכון חדש"><Plus size={30} strokeWidth={2.5} /></button>}

      <Sheet isOpen={modal.isOpen} onClose={closeModal}>
        {modal.type === 'delete' && <Confirm title="מחיקת מתכון" message="למחוק את המתכון? תהיה לכם כמה שניות לבטל." label="מחיקה" danger onConfirm={confirmDelete} onClose={closeModal} />}
        {modal.type === 'restoreFile' && <Confirm title="שחזור מקובץ" message="מתכונים מהקובץ יתווספו, ומתכונים עם אותו מזהה יוחלפו בגרסה שבקובץ." label="שחזור" onConfirm={confirmFileRestore} onClose={closeModal} />}
        {modal.type === 'settings' && <Settings_ p={{ onCloudBackup: handleCloudBackup, onCloudRestore: handleCloudRestore, onFileBackup: handleFileBackup, onFileRestore: handleFileRestore, onExportWord: handleExportWord, onLogout: handleLogout, onClose: closeModal, isTestEnv: envMode === 'test', categories: allCategories, onUpdateCategories: handleUpdateCategories, fontSize, onUpdateFontSize: updateFontSize, theme, onTheme: updateTheme }} />}
      </Sheet>
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
