import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, ArrowRight, ArrowUp, ArrowDown, Edit2, Trash2, Save, ChefHat, X, Sparkles, CheckCircle2, Circle, ListChecks, AlertCircle, Lock, KeyRound, Settings, Download, Upload, FileText, Share, Mail, Tag, ShieldCheck, Database, RefreshCw, Cloud, CloudRain, User, LogOut } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot, query } from 'firebase/firestore';
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

// --- Database Constants ---
const TEST_DB_ID = "giyGyr4ALAPNLvLybbEOPXyHDMv2";
const PROD_DB_ID = "FgETS4BeELaIGQ3QziwnDCqDQUx2"; 

const DEFAULT_CATEGORIES = ['עיקריות', 'חלבי', 'תוספות', 'סלטים', 'מאפים', 'קינוחים', 'ארוחת בוקר', 'משקאות', 'שונות'];
const DEFAULT_CATEGORY = 'שונות'; 

// --- Initialize Firebase ---
let db = null;
let auth = null;
try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase init error:", e);
}

// --- Global Styles ---
const GlobalStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap');
      body { font-family: 'Rubik', sans-serif; background-color: #000; color: #e5e7eb; overscroll-behavior-y: none; overflow-x: hidden; }
      .glass-panel {
        background: rgba(30, 30, 30, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      .gradient-text {
        background: linear-gradient(135deg, #fb7185 0%, #fb923c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .gradient-bg {
        background: linear-gradient(135deg, #e11d48 0%, #ea580c 100%);
      }
      .checkbox-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .animate-shake {
        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      input, textarea {
        font-size: 16px !important;
      }
      .hide-scroll::-webkit-scrollbar {
        display: none;
      }
      .hide-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      /* Prevent vertical scroll when swiping horizontally on categories */
      .touch-pan-x {
          touch-action: pan-x;
      }
    `}
  </style>
);

// --- Helpers ---
const normalizeCategories = (recipe) => {
    if (recipe.categories && Array.isArray(recipe.categories)) return recipe.categories;
    if (recipe.category) return [recipe.category];
    return [DEFAULT_CATEGORY];
};

// --- Components ---

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 500); 
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full animate-pulse"></div>
        <div className="relative z-10 p-6 gradient-bg rounded-[2rem] shadow-2xl shadow-rose-500/30 animate-float">
           <ChefHat size={64} className="text-white" strokeWidth={1.5} />
        </div>
      </div>
      <h1 className="mt-8 text-4xl font-black text-white tracking-tight">
        המתכונים <span className="gradient-text">שלי</span>
      </h1>
      <p className="mt-3 text-gray-500 text-lg tracking-wide">הספר המשפחתי</p>
    </div>
  );
};

const Toast = ({ show, message, type, onClose }) => {
  if (!show) return null;
  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
  const textColor = isError ? 'text-red-400' : 'text-emerald-400';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-[80] flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-xl animate-in slide-in-from-top-4 fade-in duration-300 ${bgColor}`}>
      <Icon className={textColor} size={24} />
      <span className="text-white font-medium text-sm md:text-base flex-1">{message}</span>
      <button onClick={onClose} className="mr-2 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
    </div>
  );
};

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-[2rem] p-6 md:p-8 max-w-sm w-full mx-4 border border-white/5 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};

const ConfirmationContent = ({ title, message, onConfirm, onClose }) => (
    <>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 mb-8 text-base md:text-lg font-light">{message}</p>
        <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3 rounded-2xl text-gray-300 bg-white/5 hover:bg-white/10 transition-all font-medium">ביטול</button>
            <button onClick={onConfirm} className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95">מחק</button>
        </div>
    </>
);

const SettingsContent = ({ onCloudBackup, onCloudRestore, onFileBackup, onExportWord, onLogout, onClose, isTestEnv, categories, onUpdateCategories }) => {
    const [verifyStep, setVerifyStep] = useState(0); 
    const [pendingAction, setPendingAction] = useState(null);
    const [newCatName, setNewCatName] = useState('');
    const [showCatManager, setShowCatManager] = useState(false);

    const startVerification = (actionType) => {
        setPendingAction(actionType);
        setVerifyStep(1);
    };

    const handleVerifyNext = () => {
        if (verifyStep < 3) {
            setVerifyStep(prev => prev + 1);
        } else {
            if (pendingAction === 'backup') onCloudBackup();
            if (pendingAction === 'restore') onCloudRestore();
            setVerifyStep(0);
            setPendingAction(null);
        }
    };

    const handleVerifyCancel = () => {
        setVerifyStep(0);
        setPendingAction(null);
    };

    const handleMoveCategory = (index, direction) => {
        const newCats = [...categories];
        if (direction === 'up' && index > 0) {
            [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
        } else if (direction === 'down' && index < newCats.length - 1) {
             [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
        }
        onUpdateCategories(newCats);
    };

    const handleDeleteCategory = (index) => {
        const newCats = categories.filter((_, i) => i !== index);
        onUpdateCategories(newCats);
    };

    const handleAddCatInSettings = () => {
        if (newCatName.trim() && !categories.includes(newCatName.trim())) {
            // No sorting here - append to end
            const updated = [...categories, newCatName.trim()];
            onUpdateCategories(updated);
            setNewCatName('');
        }
    };

    if (verifyStep > 0) {
        let emoji = ''; let title = ''; let message = ''; let btnConfirm = 'כן, זה אני'; let btnCancel = 'לא, סליחה';
        switch(verifyStep) {
            case 1: emoji = '👮‍♂️'; title = 'בדיקה ביטחונית'; message = 'רגע אחד... האם אתה עדי?'; break;
            case 2: emoji = '🤨'; title = 'וידוא כפול'; message = 'אתה בטוח שאתה עדי? זה נראה קצת חשוד...'; break;
            case 3: emoji = '😱'; title = 'אזהרה חמורה!'; message = 'הפעולה הזו עלולה לדרוס את כל המתכונים! האם אתה בטוח?'; btnConfirm = 'כן, אני עדי!'; btnCancel = 'בורח!'; break;
        }
        return (
            <div className="flex flex-col gap-4 text-center items-center py-2 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-5xl md:text-6xl mb-2 animate-bounce">{emoji}</div>
                <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-center mt-4 w-full">
                    <button onClick={handleVerifyCancel} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">{btnCancel}</button>
                    <button onClick={handleVerifyNext} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white font-bold shadow-lg transition-all">{btnConfirm}</button>
                </div>
            </div>
        );
    }

    if (showCatManager) {
        return (
            <div className="flex flex-col gap-3 max-h-[70vh]">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setShowCatManager(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowRight size={20} /></button>
                    <h3 className="text-xl font-bold text-white">עריכת קטגוריות</h3>
                    <div className="w-9"></div> 
                </div>
                <div className="flex gap-2 mb-2">
                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="קטגוריה חדשה..." className="flex-1 bg-[#151515] text-white text-sm px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-rose-500/50" />
                    <button onClick={handleAddCatInSettings} className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl hover:bg-emerald-500/30"><Plus size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                    {categories.map((cat, index) => (
                        <div key={cat} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="font-medium text-gray-200">{cat}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp size={16} /></button>
                                <button onClick={() => handleMoveCategory(index, 'down')} disabled={index === categories.length - 1} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown size={16} /></button>
                                <div className="w-px h-4 bg-white/10 mx-1"></div>
                                <button onClick={() => handleDeleteCategory(index)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto no-scrollbar">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">הגדרות</h3>
            {isTestEnv && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl mb-2 flex items-center gap-3">
                    <Database className="text-orange-400" size={20} />
                    <div>
                        <div className="text-orange-400 font-bold text-sm">מצב סביבת בדיקה</div>
                        <div className="text-orange-500/70 text-xs">השינויים נשמרים במסד בדיקות</div>
                    </div>
                </div>
            )}
            <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5 space-y-3 md:space-y-4">
                <button onClick={() => setShowCatManager(true)} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-right group border border-white/5">
                    <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg group-hover:bg-yellow-500/30 transition-colors"><Tag size={18} /></div>
                    <div>
                        <div className="text-white font-medium text-sm md:text-base">ניהול קטגוריות</div>
                        <div className="text-gray-500 text-xs">עריכת רשימה וסדר</div>
                    </div>
                </button>
                <div className="h-px bg-white/10"></div>
                
                {/* File Actions (Moved Up) */}
                <div>
                    <h4 className="text-xs md:text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2"><FileText size={14} /> פעולות קבצים</h4>
                    <button onClick={onExportWord} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-right mb-2 group">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:bg-blue-500/30 transition-colors"><FileText size={18} /></div>
                        <div>
                            <div className="text-white font-medium text-sm md:text-base">הורדה לקובץ Word</div>
                            <div className="text-gray-500 text-xs">להדפסה נוחה</div>
                        </div>
                    </button>
                    <button onClick={onFileBackup} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-right group">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:bg-emerald-500/30 transition-colors"><Download size={18} /></div>
                        <div>
                            <div className="text-white font-medium text-sm md:text-base">שמירת גיבוי למכשיר</div>
                            <div className="text-gray-500 text-xs">קובץ JSON</div>
                        </div>
                    </button>
                </div>

                <div className="h-px bg-white/10"></div>
                
                {/* Cloud Actions (Moved Down) */}
                <div>
                    <h4 className="text-xs md:text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2"><Cloud size={14} /> פעולות ענן (מפתחים)</h4>
                    <button onClick={() => startVerification('backup')} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-right mb-2 group border border-white/5">
                        <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg group-hover:bg-rose-500/30 transition-colors"><RefreshCw size={18} /></div>
                        <div>
                            <div className="text-white font-medium text-sm md:text-base">יצירת גיבוי מלא</div>
                            <div className="text-gray-500 text-xs">שומר תמונת מצב</div>
                        </div>
                    </button>
                    <button onClick={() => startVerification('restore')} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-right group border border-white/5">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:bg-indigo-500/30 transition-colors"><CloudRain size={18} /></div>
                        <div>
                            <div className="text-white font-medium text-sm md:text-base">שחזור מגיבוי</div>
                            <div className="text-gray-500 text-xs">שחזור נתונים</div>
                        </div>
                    </button>
                </div>
                
                <div className="h-px bg-white/10"></div>
                
                <button onClick={onLogout} className="w-full flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-red-500/10 rounded-xl transition-all text-right group border border-white/5 border-red-500/10 hover:border-red-500/30">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-lg group-hover:bg-red-500/30 transition-colors"><LogOut size={18} /></div>
                    <div>
                        <div className="text-red-400 font-medium text-sm md:text-base">התנתקות</div>
                        <div className="text-red-500/70 text-xs">יציאה מהחשבון</div>
                    </div>
                </button>

            </div>
            <button onClick={onClose} className="mt-2 w-full py-3 rounded-2xl text-gray-400 hover:bg-white/5 transition-colors">סגור</button>
        </div>
    );
};

const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const pass = password.trim();
    if (pass === 'קובי') onLogin(PROD_DB_ID, 'prod');
    else if (pass === 'טסט') onLogin(TEST_DB_ID, 'test');
    else { 
        setError(true); 
        setAttempts(prev => prev + 1);
        setTimeout(() => setError(false), 500); 
    }
  };
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#121212] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center shadow-lg shadow-rose-900/30 mb-6 rotate-3"><Lock className="text-white" size={36} /></div>
          <h1 className="text-3xl font-black text-white mb-2">ברוכים הבאים</h1>
          <p className="text-gray-400 mb-8">ספר המתכונים של המשפחה</p>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-[#0a0a0a] text-white text-center text-lg font-medium p-5 rounded-2xl border outline-none transition-all placeholder-gray-700 ${error ? 'border-red-500/50 text-red-400 animate-shake focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50'}`} placeholder="סיסמה" autoFocus />
              <KeyRound className="absolute top-1/2 right-5 -translate-y-1/2 text-gray-600" size={20} />
            </div>
            <button type="submit" className="w-full gradient-bg text-white font-bold py-5 rounded-2xl shadow-xl shadow-rose-900/20 transition-all active:scale-[0.98] hover:brightness-110 text-lg">כניסה</button>
          </form>
          {error && <p className="text-red-400 mt-4 text-sm animate-in fade-in">סיסמה שגויה, נסו שוב</p>}
          
          {attempts >= 3 && (
            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-rose-400 font-bold mb-2 flex items-center justify-center gap-2 text-sm"><Sparkles size={14}/> רמז לכניסה</div>
                <div className="text-gray-400 text-sm space-y-1">
                    <p>לכניסה לסביבת הטסט הזן <strong>"טסט"</strong></p>
                    <p>לכניסה לחשבון המשפחתי הזן את <strong>שם המשפחה</strong></p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TextWithLinks = ({ text }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-4 decoration-orange-400/30 break-all font-medium transition-colors" onClick={(e) => e.stopPropagation()}>{part}</a>;
        return part;
      })}
    </span>
  );
};

const ChecklistView = ({ content }) => {
  const [checkedState, setCheckedState] = useState({});
  const lines = useMemo(() => content.split('\n'), [content]);
  const toggleLine = (index) => setCheckedState(prev => ({ ...prev, [index]: !prev[index] }));
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-4 md:h-6" />;
        const isChecked = checkedState[index];
        return (
          <div key={index} onClick={() => toggleLine(index)} className={`group flex flex-row-reverse items-start gap-4 p-4 rounded-2xl cursor-pointer border checkbox-transition select-none ${isChecked ? 'bg-[#151515] border-white/5 opacity-60' : 'bg-[#1a1a1a] border-white/10 hover:border-rose-500/30 hover:bg-[#202020] shadow-sm'}`}>
            <div className={`mt-1 checkbox-transition ${isChecked ? 'text-emerald-500' : 'text-gray-500 group-hover:text-rose-400'}`}>{isChecked ? <CheckCircle2 size={24} weight="fill" /> : <Circle size={24} />}</div>
            <div className={`text-base md:text-lg leading-relaxed flex-1 checkbox-transition font-medium ${isChecked ? 'line-through text-gray-600 decoration-emerald-500/50' : 'text-gray-100'}`}><TextWithLinks text={line} /></div>
          </div>
        );
      })}
    </div>
  );
};

const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
    const scrollContainerRef = useRef(null);
    const [showRightShadow, setShowRightShadow] = useState(false);
    const [showLeftShadow, setShowLeftShadow] = useState(true);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const selectedBtn = scrollContainerRef.current.querySelector(`[data-category="${selectedCategory}"]`);
            if (selectedBtn) {
                // Manual centering to avoid vertical jumps and smooth scroll
                const container = scrollContainerRef.current;
                const scrollLeft = selectedBtn.offsetLeft - (container.clientWidth / 2) + (selectedBtn.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [selectedCategory]);

    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;
        const scrollLeft = Math.abs(el.scrollLeft); 
        setShowRightShadow(scrollLeft > 10);
        setShowLeftShadow(scrollWidth - scrollLeft - clientWidth > 10);
    };
    
    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [categories]);

    return (
      <div className="sticky top-[68px] md:top-[88px] z-20 bg-black/95 backdrop-blur-sm pb-2 pt-2 border-b border-white/5">
        <div className="max-w-3xl mx-auto relative group">
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightShadow ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Removed snap-x to allow smoother programmatic scrolling */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-x-auto hide-scroll flex gap-2 px-4 w-full relative touch-pan-x">
                <button data-category="הכל" onClick={() => onSelectCategory('הכל')} className={`shrink-0 px-5 py-2.5 rounded-full whitespace-nowrap text-sm md:text-base font-bold transition-all duration-300 border ${selectedCategory === 'הכל' ? 'gradient-bg text-white shadow-lg shadow-rose-900/20 border-transparent ring-2 ring-rose-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 border-transparent hover:text-white'}`}>הכל</button>
                {categories.map(cat => (
                    // Removed scale-105 to prevent layout shifts during scroll
                    <button key={cat} data-category={cat} onClick={() => onSelectCategory(cat)} className={`shrink-0 px-5 py-2.5 rounded-full whitespace-nowrap text-sm md:text-base font-bold transition-all duration-300 border ${selectedCategory === cat ? 'gradient-bg text-white shadow-lg shadow-rose-900/20 border-transparent ring-2 ring-rose-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 border-transparent hover:text-white'}`}>{cat}</button>
                ))}
                <div className="w-2 shrink-0"></div>
            </div>
        </div>
      </div>
    );
};

// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dbId, setDbId] = useState(null);
  const [envMode, setEnvMode] = useState(''); 
  const [view, setView] = useState('list');
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([...DEFAULT_CATEGORIES]);

  // --- Auto-Login Check ---
  useEffect(() => {
    const savedDbId = localStorage.getItem('recipe_db_id');
    const savedMode = localStorage.getItem('recipe_env_mode');
    if (savedDbId && savedMode) {
        handleLogin(savedDbId, savedMode, true);
    }
  }, []);

  // --- Helpers for DB Persistence ---
  const saveCategoriesToDb = async (newCats) => {
    if (!db || !dbId) return;
    try {
        await setDoc(doc(db, 'notes', dbId, 'settings', 'appSettings'), { categories: newCats }, { merge: true });
    } catch (e) {
        console.error("Error saving categories:", e);
    }
  };

  // --- Load Categories from DB ---
  useEffect(() => {
    if (!db || !dbId) return;
    const settingsRef = doc(db, 'notes', dbId, 'settings', 'appSettings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().categories) {
            setAllCategories(docSnap.data().categories);
        }
    });
    return () => unsubscribe();
  }, [dbId]);

  // --- Sync Categories from Recipes (Logic Updated to Persistence) ---
  useEffect(() => {
      if (recipes.length > 0) {
          const currentCats = [...allCategories];
          let changed = false;
          recipes.forEach(r => {
              normalizeCategories(r).forEach(c => {
                  if (!currentCats.includes(c)) {
                      currentCats.push(c);
                      changed = true;
                  }
              });
          });
          
          if (changed) {
            // Update both state (optimistic) and DB
            setAllCategories(currentCats);
            saveCategoriesToDb(currentCats);
          }
      }
  }, [recipes, dbId]); // Added dbId to deps to ensure saving works

  useEffect(() => {
      if (!isAuthenticated || !db || !dbId) return;
      setLoading(true);
      const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { console.error("Auth error", e); showToast("שגיאת התחברות לשרת", "error"); } };
      initAuth();
      const q = query(collection(db, 'notes', dbId, 'myNotes'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const loadedRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRecipes(loadedRecipes);
          setLoading(false);
      }, (error) => { console.error("Error fetching recipes:", error); showToast("שגיאה בטעינת נתונים", "error"); setLoading(false); });
      return () => unsubscribe();
  }, [isAuthenticated, dbId]);

  const handleLogin = (id, mode, isAuto = false) => {
      // Save session
      localStorage.setItem('recipe_db_id', id);
      localStorage.setItem('recipe_env_mode', mode);
      
      setDbId(id); setEnvMode(mode); setIsAuthenticated(true);
      if (!isAuto) {
         showToast(mode === 'test' ? 'נכנס למצב בדיקה 🧪' : 'ברוכים הבאים למשפחה! 👨‍🍳', 'success');
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('recipe_db_id');
      localStorage.removeItem('recipe_env_mode');
      setIsAuthenticated(false);
      setDbId(null);
      setEnvMode('');
      setRecipes([]);
      setModalState(prev => ({...prev, isOpen: false}));
      showToast('התנתקת בהצלחה 👋', 'info');
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleAddCategory = (newCat) => {
      if (!newCat.trim()) return;
      if (allCategories.includes(newCat.trim())) { showToast('הקטגוריה כבר קיימת', 'error'); return; }
      
      const updated = [...allCategories, newCat.trim()];
      setAllCategories(updated); // Optimistic update
      saveCategoriesToDb(updated); // Persist
      showToast('קטגוריה נוספה', 'success');
  };

  const handleUpdateCategories = (newCats) => {
      setAllCategories(newCats); // Optimistic update
      saveCategoriesToDb(newCats); // Persist
  };

  const handleSave = async (recipe) => {
    if (!db || !dbId) return;
    try {
        const recipeData = { 
            title: recipe.title, 
            content: recipe.content, 
            categories: recipe.categories || [DEFAULT_CATEGORY], 
            chef: recipe.chef || '',
            updatedAt: new Date().toISOString() 
        };
        if (recipe.id) await updateDoc(doc(db, 'notes', dbId, 'myNotes', recipe.id), recipeData);
        else await addDoc(collection(db, 'notes', dbId, 'myNotes'), recipeData);
        showToast('המתכון נשמר בהצלחה! 😋', 'success'); setView('list'); setActiveRecipe(null);
    } catch (e) { console.error("Save error", e); showToast("שגיאה בשמירת המתכון", "error"); }
  };

  const confirmDelete = async () => {
    const id = modalState.data;
    if (!db || !dbId || !id) return;
    try {
        await deleteDoc(doc(db, 'notes', dbId, 'myNotes', id));
        if (activeRecipe?.id === id) { setView('list'); setActiveRecipe(null); }
        setModalState(prev => ({ ...prev, isOpen: false })); showToast('המתכון נמחק', 'info');
    } catch (e) { console.error("Delete error", e); showToast("שגיאה במחיקת המתכון", "error"); }
  };

  const handleCloudBackup = async () => {
      if (!db || !dbId) return;
      try {
          showToast('יוצר גיבוי מלא בענן...', 'info');
          const backupRef = doc(db, 'notes', dbId, 'backups', 'latest');
          await setDoc(backupRef, { recipes, categories: allCategories, savedAt: new Date().toISOString(), version: 1 });
          showToast('גיבוי ענן נוצר בהצלחה! ☁️', 'success');
      } catch (e) { console.error("Cloud backup error:", e); showToast("שגיאה ביצירת גיבוי", "error"); }
  };

  const handleCloudRestore = async () => {
      if (!db || !dbId) return;
      try {
          showToast('מחפש גיבוי בענן...', 'info');
          const backupRef = doc(db, 'notes', dbId, 'backups', 'latest');
          const docSnap = await getDoc(backupRef);
          if (!docSnap.exists()) { showToast('לא נמצא גיבוי בענן', 'error'); return; }
          const data = docSnap.data(); const recipesToRestore = data.recipes || [];
          if (recipesToRestore.length === 0) { showToast("הגיבוי ריק ממתכונים", "error"); return; }
          showToast(`משחזר ${recipesToRestore.length} מתכונים...`, 'info');
          let successCount = 0;
          for (const recipe of recipesToRestore) {
              const recipeData = { 
                  title: recipe.title, 
                  content: recipe.content, 
                  categories: recipe.categories || [DEFAULT_CATEGORY], 
                  chef: recipe.chef || '',
                  updatedAt: recipe.updatedAt || new Date().toISOString() 
              };
              if (recipe.id) await setDoc(doc(db, 'notes', dbId, 'myNotes', recipe.id), recipeData);
              else await addDoc(collection(db, 'notes', dbId, 'myNotes'), recipeData);
              successCount++;
          }
          if (data.categories) {
              setAllCategories(data.categories);
              saveCategoriesToDb(data.categories); // Also save restored categories to settings
          }
          setModalState(prev => ({ ...prev, isOpen: false })); showToast(`שוחזרו בהצלחה ${successCount} מתכונים מהענן!`, 'success');
      } catch (e) { console.error("Cloud restore error:", e); showToast("שגיאה בשחזור מהענן", "error"); }
  };

  const handleFileBackup = () => {
      const dataStr = JSON.stringify({ recipes, categories: allCategories }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `backup_${envMode}_${new Date().toISOString().slice(0,10)}.json`);
      linkElement.click();
  };

  const handleFileRestore = (file) => {
      if (!file || !db || !dbId) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = JSON.parse(e.target.result); const recipesToRestore = data.recipes || [];
              if (recipesToRestore.length === 0) { showToast("לא נמצאו מתכונים בקובץ", "error"); return; }
              showToast(`משחזר מקובץ ${recipesToRestore.length} מתכונים...`, "info");
              setModalState(prev => ({ ...prev, isOpen: false }));
              let successCount = 0;
              for (const recipe of recipesToRestore) {
                  const recipeData = { 
                      title: recipe.title, 
                      content: recipe.content, 
                      categories: recipe.categories || [DEFAULT_CATEGORY], 
                      chef: recipe.chef || '',
                      updatedAt: recipe.updatedAt || new Date().toISOString() 
                  };
                  if (recipe.id) await setDoc(doc(db, 'notes', dbId, 'myNotes', recipe.id), recipeData);
                  else await addDoc(collection(db, 'notes', dbId, 'myNotes'), recipeData);
                  successCount++;
              }
              if (data.categories) {
                  setAllCategories(data.categories);
                  saveCategoriesToDb(data.categories); // Save imported categories to settings
              }
              showToast(`שוחזרו בהצלחה ${successCount} מתכונים!`, "success");
          } catch (error) { console.error("Restore error:", error); showToast("שגיאה בקריאת קובץ הגיבוי", "error"); }
      };
      reader.readAsText(file);
  };

  const handleExportWord = () => {
    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset='utf-8'><title>ספר מתכונים</title><style>
            body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; background: white; color: black; }
            h1 { text-align: center; color: #e11d48; font-size: 24pt; margin-bottom: 24px; }
            .recipe { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; page-break-inside: avoid; }
            h2 { color: #333; font-size: 18pt; margin-bottom: 10px; }
            .meta { color: #666; font-size: 10pt; margin-bottom: 15px; font-style: italic; }
            .content { white-space: pre-wrap; font-size: 12pt; line-height: 1.6; color: #000; }
          </style></head><body><h1>ספר המתכונים שלי</h1>`;
      let body = '';
      recipes.forEach(r => {
          const cats = normalizeCategories(r).join(', ');
          const chefInfo = r.chef ? ` | שף: ${r.chef}` : '';
          body += `<div class="recipe"><h2>${r.title}</h2><div class="meta">קטגוריות: ${cats}${chefInfo}</div><div class="content">${r.content}</div></div>`;
      });
      const html = header + body + "</body></html>";
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `ספר_מתכונים_מלא.doc`; link.click();
      showToast("קובץ Word מוכן להורדה", "success");
    } catch (e) { console.error("Export error", e); showToast("שגיאה ביצירת הקובץ", "error"); }
  };

  const handleShareEmail = (recipe) => {
      const cats = normalizeCategories(recipe).join(', ');
      window.location.href = `mailto:?subject=${encodeURIComponent(`מתכון: ${recipe.title}`)}&body=${encodeURIComponent(`${recipe.title}\n(${cats})\n\n${recipe.content}\n\nנשלח מאפליקציית המתכונים שלי`)}`;
  };

  const openDeleteModal = (id) => setModalState({ isOpen: true, type: 'delete', data: id });
  const openSettingsModal = () => setModalState({ isOpen: true, type: 'settings', data: null });
  const closeModal = () => setModalState({ ...modalState, isOpen: false });
  const startEdit = (recipe) => { setActiveRecipe(recipe); setView('edit'); };
  const startCreate = () => { setActiveRecipe({ title: '', content: '', categories: [], chef: '' }); setView('create'); };
  const viewRecipe = (recipe) => { setActiveRecipe(recipe); setView('view'); };
  const goBack = () => { setView('list'); setActiveRecipe(null); };

  // --- Sorting & Filtering Logic ---
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(r => {
        const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (r.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (r.chef || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedCategory === 'הכל') return matchesSearch;
        const rCats = normalizeCategories(r);
        return matchesSearch && rCats.includes(selectedCategory);
      })
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'he'));
  }, [recipes, searchQuery, selectedCategory]);

  const renderHeader = () => (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/5 p-3 md:p-4 transition-all duration-300">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {view === 'list' ? (
          <div className="flex items-center gap-3 w-full">
            <button onClick={openSettingsModal} className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shrink-0"><Settings size={22} /></button>
            <div className="hidden sm:flex flex-1 justify-center"><h1 className="text-2xl font-black text-white tracking-tight">המתכונים <span className="gradient-text">שלי</span></h1></div>
            <div className="relative flex-1 sm:flex-none sm:w-64 md:w-80 group">
              <input type="text" placeholder="חיפוש מתכון..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0a0a0a] text-white text-base rounded-2xl py-2.5 md:py-3 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-rose-500/30 border border-white/5 placeholder-gray-600 transition-all duration-300 group-hover:border-white/10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-rose-400 transition-colors"><Search size={18} /></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button onClick={goBack} className="p-2 md:p-3 -mr-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90 shrink-0"><ArrowRight className="transform rotate-180" size={24} /></button>
            <h1 className="text-lg md:text-xl font-bold truncate flex-1 text-white pr-2">{view === 'create' ? 'יצירת מתכון' : view === 'edit' ? 'עריכה' : activeRecipe?.title}</h1>
            {view === 'view' && (
              <div className="flex gap-1 md:gap-2 shrink-0">
                <button onClick={() => handleShareEmail(activeRecipe)} className="p-2 md:p-3 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"><Mail size={20} /></button>
                <button onClick={() => startEdit(activeRecipe)} className="p-2 md:p-3 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"><Edit2 size={20} /></button>
                <button onClick={() => openDeleteModal(activeRecipe.id)} className="p-2 md:p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"><Trash2 size={20} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );

  const RecipeForm = ({ initialData, onSave, allCategories, onAddCategory }) => {
    const [title, setTitle] = useState(initialData.title);
    const [content, setContent] = useState(initialData.content);
    const [chef, setChef] = useState(initialData.chef || '');
    const [selectedCats, setSelectedCats] = useState(normalizeCategories(initialData));
    const [errors, setErrors] = useState({});
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    
    const toggleCategory = (cat) => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : (prev.length >= 2 ? prev : [...prev, cat]));
    const handleAddNewCat = (e) => {
        e.preventDefault();
        if (newCatName.trim()) {
            onAddCategory(newCatName);
            if (selectedCats.length < 2) setSelectedCats(prev => [...prev, newCatName.trim()]);
            setNewCatName(''); setIsAddingCat(false);
        }
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      const newErrors = {};
      if (!title.trim()) newErrors.title = true;
      if (!content.trim()) newErrors.content = true;
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); showToast('נא למלא את כל השדות', 'error'); return; }
      onSave({ ...initialData, title, content, chef, categories: selectedCats.length > 0 ? selectedCats : [DEFAULT_CATEGORY] });
    };
    return (
      <form onSubmit={handleSubmit} className="flex flex-col min-h-[calc(100vh-100px)] max-w-3xl mx-auto p-4 md:p-5 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-24">
        <div className="mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold mb-2 pr-1 uppercase tracking-wider text-gray-500">כותרת</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-[#151515] text-white text-xl md:text-2xl font-bold p-4 md:p-6 rounded-[1.5rem] border outline-none transition-all placeholder-gray-700 ${errors.title ? 'border-red-500/50' : 'border-white/5 focus:border-rose-500/50'}`} placeholder="למשל: הפסטה המפורסמת של סבתא..." autoFocus />
        </div>
        
        <div className="mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold mb-2 pr-1 uppercase tracking-wider text-gray-500">שף/ית</label>
          <div className="relative">
             <input type="text" value={chef} onChange={(e) => setChef(e.target.value)} className="w-full bg-[#151515] text-white text-base md:text-lg font-medium p-4 rounded-[1.5rem] border border-white/5 focus:border-rose-500/50 outline-none transition-all placeholder-gray-700 pl-12" placeholder="מי הכין את המנה?" />
             <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          </div>
        </div>

        <div className="mb-4 md:mb-6">
            <label className="block text-xs md:text-sm font-semibold mb-2 pr-1 uppercase tracking-wider text-gray-500">קטגוריות (עד 2)</label>
            <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                    <button type="button" key={cat} onClick={() => toggleCategory(cat)} className={`px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${selectedCats.includes(cat) ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-[#151515] border-white/5 text-gray-500 hover:bg-white/5'}`}>{cat}</button>
                ))}
                {!isAddingCat ? (
                    <button type="button" onClick={() => setIsAddingCat(true)} className="px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all border border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white bg-transparent flex items-center gap-1"><Plus size={14} /> חדש</button>
                ) : (
                   <div className="flex items-center gap-2 animate-in fade-in w-full sm:w-auto mt-2 sm:mt-0">
                        <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="שם..." className="flex-1 bg-[#151515] text-white text-sm px-3 py-2 rounded-xl border border-white/10 outline-none sm:w-32 focus:border-rose-500/50" autoFocus />
                        <button type="button" onClick={handleAddNewCat} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><CheckCircle2 size={16} /></button>
                        <button type="button" onClick={() => setIsAddingCat(false)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"><X size={16} /></button>
                   </div> 
                )}
            </div>
        </div>
        <div className="flex-1 mb-6 flex flex-col">
          <label className="block text-xs md:text-sm font-semibold mb-2 pr-1 uppercase tracking-wider text-gray-500">הוראות ורכיבים</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className={`flex-1 min-h-[300px] w-full bg-[#151515] text-gray-100 p-4 md:p-6 rounded-[1.5rem] border outline-none resize-none text-base md:text-lg leading-7 md:leading-8 transition-all placeholder-gray-700 ${errors.content ? 'border-red-500/50' : 'border-white/5 focus:border-rose-500/50'}`} placeholder="רשום כל שורה בנפרד..." />
        </div>
        <button type="submit" className="w-full gradient-bg text-white font-bold py-4 md:py-5 rounded-[1.5rem] shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:brightness-110 text-lg sticky bottom-4 z-10"><Save size={24} />שמירה</button>
      </form>
    );
  };

  const RecipeDetail = ({ recipe }) => {
    const [isChecklistMode, setIsChecklistMode] = useState(false);
    return (
      <div className="max-w-3xl mx-auto p-3 md:p-4 animate-in fade-in zoom-in-95 duration-500 pb-24">
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 bg-black rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl min-h-[60vh]">
          <div className="flex flex-col gap-2 mb-6 border-b border-white/10 pb-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">{recipe.title}</h2>
                    {recipe.chef && <div className="text-gray-500 flex items-center gap-2 mt-2"><User size={16} /><span className="text-lg">{recipe.chef}</span></div>}
                </div>
                {/* Fixed checklist button width for mobile */}
                <button onClick={() => setIsChecklistMode(!isChecklistMode)} className={`w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${isChecklistMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'}`}><ListChecks size={20} />{isChecklistMode ? 'מצב קריאה' : 'מצב צ\'ק-ליסט'}</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                {normalizeCategories(recipe).map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-rose-400 text-xs md:text-sm font-medium"><Tag size={12} /> {c}</span>
                ))}
            </div>
          </div>
          {/* Made font slightly bolder (font-medium) */}
          <div className="text-gray-100">{isChecklistMode ? <ChecklistView content={recipe.content} /> : <div className="whitespace-pre-wrap text-base md:text-xl leading-relaxed font-medium tracking-wide break-words"><TextWithLinks text={recipe.content} /></div>}</div>
        </div>
      </div>
    );
  };

  const RecipeList = () => (
    <>
    <CategoryTabs categories={allCategories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
    <div className="max-w-3xl mx-auto p-3 md:p-4 grid gap-3 md:gap-5 pb-32 animate-in fade-in duration-500 mt-2">
      {loading ? (
          <div className="text-center mt-20 flex flex-col items-center"><div className="mb-4 animate-spin-slow"><Sparkles size={48} className="text-rose-500" /></div><p className="text-gray-400">טוען מתכונים מהענן...</p></div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center mt-20 flex flex-col items-center px-4"><div className="mb-8 p-8 bg-[#151515] rounded-[2rem] border border-white/5 shadow-inner relative overflow-hidden group"><Sparkles size={48} className="text-gray-600 group-hover:text-rose-400 transition-colors" strokeWidth={1.5} /></div><p className="text-xl md:text-2xl font-bold text-white mb-2">לא נמצאו מתכונים</p><p className="text-gray-500 text-sm md:text-base">זה הזמן ליצור משהו טעים!</p></div>
      ) : (
        filteredRecipes.map(recipe => (
          <div key={recipe.id} onClick={() => viewRecipe(recipe)} className="group relative bg-[#121212] hover:bg-[#1a1a1a] p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border border-white/5 hover:border-rose-500/30 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-rose-900/10 hover:-translate-y-1 active:scale-[0.99] overflow-hidden">
            <div className="absolute top-0 right-8 left-8 h-[1px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {normalizeCategories(recipe).slice(0, 2).map((c, i) => (
                        <span key={i} className="text-[10px] md:text-xs font-bold text-rose-500/80 uppercase tracking-wide bg-rose-500/10 px-2 py-0.5 rounded-md">{c}</span>
                    ))}
                    {normalizeCategories(recipe).length > 2 && <span className="text-[10px] text-gray-600">+{normalizeCategories(recipe).length - 2}</span>}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-1 group-hover:text-rose-400 transition-colors leading-tight break-words whitespace-normal">{recipe.title}</h3>
                {recipe.chef && <div className="text-gray-500 text-sm mb-2 flex items-center gap-1"><User size={12} /> {recipe.chef}</div>}
                <p className="text-gray-400 line-clamp-2 text-sm md:text-base leading-relaxed pl-2 md:pl-4 opacity-70 group-hover:opacity-100 transition-opacity font-medium break-words whitespace-normal">{recipe.content}</p>
              </div>
              <div className="mt-1 text-gray-700 group-hover:text-rose-500/50 transition-colors p-2 bg-white/5 rounded-full group-hover:bg-white/10 shrink-0"><ArrowRight className="transform rotate-180" size={18} /></div>
            </div>
          </div>
        ))
      )}
    </div>
    </>
  );

  if (showSplash) return <div dir="rtl"><GlobalStyles /><SplashScreen onFinish={() => setShowSplash(false)} /></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-black text-gray-200" dir="rtl"><GlobalStyles /><LoginScreen onLogin={handleLogin} /><Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({...prev, show: false}))} /></div>;

  return (
    <div className="min-h-screen bg-black text-gray-200" dir="rtl">
      <GlobalStyles />
      {renderHeader()}
      <main className="relative z-0">
        {view === 'list' && <RecipeList />}
        {view === 'view' && <RecipeDetail recipe={activeRecipe} />}
        {(view === 'edit' || view === 'create') && <RecipeForm initialData={activeRecipe} onSave={handleSave} allCategories={allCategories} onAddCategory={handleAddCategory} />}
      </main>
      {view === 'list' && (
        <button onClick={startCreate} className="fixed bottom-6 left-6 md:bottom-8 md:left-8 gradient-bg text-white rounded-[2rem] p-4 md:p-5 shadow-2xl shadow-rose-600/30 transition-all hover:scale-110 active:scale-95 z-40 group hover:rotate-90"><Plus size={28} md:size={32} strokeWidth={2.5} /></button>
      )}
      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
          {modalState.type === 'delete' && <ConfirmationContent title="מחיקת מתכון" message="בטוח שרוצים למחוק? אי אפשר להתחרט אחר כך..." onConfirm={confirmDelete} onClose={closeModal} />}
          {modalState.type === 'settings' && <SettingsContent onCloudBackup={handleCloudBackup} onCloudRestore={handleCloudRestore} onFileBackup={handleFileBackup} onFileRestore={handleFileRestore} onExportWord={handleExportWord} onLogout={handleLogout} onClose={closeModal} isTestEnv={envMode === 'test'} categories={allCategories} onUpdateCategories={handleUpdateCategories} />}
      </Modal>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({...prev, show: false}))} />
    </div>
  );
}
