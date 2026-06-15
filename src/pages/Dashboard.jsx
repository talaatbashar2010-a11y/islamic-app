import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [alerts, setAlerts] = useState({
    competition: "المسابقة الرمضانية الكبرى مفتوحة الآن 🏆",
    lesson: "الدرس القادم: فقه المعاملات بعد المغرب 🕌"
  });
  
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'alerts', 'status');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAlerts(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 text-right relative" dir="rtl">
      
      {/* Header & Alerts */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div className="text-center md:text-right">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-arabic">
           طريق الهداية والطمأنينة 🌙
          </h1>
          <p className="text-gray-400 mt-1">مرحباً بك ، نسأل الله لك يوماً عامراً بالذكر والمغفرة</p>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="animate-pulse bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm font-bold">
            {alerts.competition}
          </div>
          <div className="bg-blue-500/10 border border-blue-500 text-blue-400 px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            {alerts.lesson}
          </div>
        </div>
      </header>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-2xl border-r-4 border-green-400 shadow-xl flex flex-col justify-between">
          <h2 className="text-lg font-bold mb-3 text-green-400 flex items-center gap-2">🕌 مواقيت الصلاة اليوم</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/5 p-2 rounded-lg border border-green-500/20">
              <span>الظهر </span>
              <span>12:50 PM</span>
            </div>
            <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/5 p-2 rounded-lg border border-green-500/20">
              <span>العصر </span>
              <span>04:14 PM</span>
            </div>
           <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/5 p-2 rounded-lg border border-green-500/20">
              <span>المغرب</span>
              <span>07:42 PM</span>
          </div>
          <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/5 p-2 rounded-lg border border-green-500/20">
              <span>العشاء</span>
              <span>09:15 PM</span>
          </div>
       <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/5 p-2 rounded-lg border border-green-500/20">
              <span>الفجر</span>
              <span>04:20 AM</span>
        </div>
         </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center border border-gray-700/50">
          <h2 className="text-xs text-blue-400 mb-2 font-extrabold uppercase tracking-wide bg-blue-500/10 px-3 py-1 rounded-full">آية اليوم </h2>
          <p className="text-xl font-arabic font-bold leading-relaxed text-gray-100">"إِنَّ مَعَ الْعُسْرِ يُسْرًا"</p>
          <span className="text-xs text-gray-500 mt-2 font-medium">سورة الشرح</span>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center border border-gray-700/50">
          <h2 className="text-xs text-teal-400 mb-2 font-extrabold uppercase tracking-wide bg-teal-500/10 px-3 py-1 rounded-full">حديث اليوم</h2>
          <p className="text-lg font-arabic font-bold leading-relaxed text-gray-100">"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"</p>
          <span className="text-xs text-gray-500 mt-2 font-medium">رواه البخاري</span>
        </div>
      </div>

      {/* Main Sections */}
      <h2 className="text-2xl font-bold mb-6 text-white border-r-4 border-blue-500 pr-3">الأقسام الرئيسية للمنصة</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'القرآن الكريم', icon: '📖', type: 'modal', path: '/quran', color: 'hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
          { title: 'الحديث النبوي', icon: '📜', type: 'modal', path: '/hadith', color: 'hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
          { title: 'ركن الفتاوى', icon: '⚖️', type: 'modal', modalId: 'fatwa', color: 'hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
          { title: 'المكتبة الرقمية', icon: '📚', type: 'modal', path: '/library', color: 'hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]' }, 
          { title: 'البودكاست الدعوي', icon: '🎧', type: 'modal', modalId: 'podcast', color: 'hover:border-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]' },
          { title: 'المسابقات🏆', icon: '🏆', type: 'link', path: '/quiz', color: 'hover:border-teal-400 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]' },
        ].map((section, index) => (
          section.type === 'link' ? (
            <Link 
              to={section.path}
              key={index} 
              className={`bg-gray-800 flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-700 transition-all duration-300 transform hover:-translate-y-1 ${section.color}`}
            >
              <span className="text-4xl mb-3">{section.icon}</span>
              <span className="text-sm font-bold text-gray-200">{section.title}</span>
            </Link>
          ) : (
            <button 
              onClick={() => setActiveModal(section.modalId)}
              key={index} 
              className={`bg-gray-800 flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-700 transition-all duration-300 transform hover:-translate-y-1 text-right ${section.color}`}
            >
              <span className="text-4xl mb-3">{section.icon}</span>
              <span className="text-sm font-bold text-gray-200">{section.title}</span>
            </button>
          )
        ))}
      </div>

      {/* --- نوافذ منبثقة تفاعلية ذكية للأقسام التي لم تبنى بعد --- */}
      {activeModal === 'fatwa' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-2xl border border-amber-500 max-w-md w-full text-center">
            <span className="text-5xl">⚖️</span>
            <h3 className="text-xl font-bold my-3 text-amber-400">قسم الفتاوى الشرعية الأكاديمي</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">قريباً.. ستتمكن من طرح أسئلتك الفقهية بكل سرية ليجيب عليها كوكبة من العلماء والفقهاء المعتمدين.</p>
            <button onClick={() => setActiveModal(null)} className="bg-amber-500 hover:bg-amber-600 px-6 py-2 rounded-xl text-black font-bold transition-all">فهمت ذلك</button>
          </div>
        </div>
      )}

      {activeModal === 'podcast' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-2xl border border-pink-500 max-w-md w-full text-center">
            <span className="text-5xl">🎧</span>
            <h3 className="text-xl font-bold my-3 text-pink-400">البودكاست الصوتي الإسلامي</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">ترقبوا سلاسل صوتية إيمانية مؤثرة بجودة عالية جداً، ومقاطع مخصصة لأذكار الصباح والمساء والرقية الشرعية.</p>
            <button onClick={() => setActiveModal(null)} className="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-xl font-bold transition-all">حسناً</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;