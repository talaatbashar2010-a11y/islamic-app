import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Hadith = () => {
  const hadithData = [
    { id: 1, text: "«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»", narrator: "رواه البخاري ومسلم", category: "العقيدة والنية" },
    { id: 2, text: "«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»", narrator: "رواه مسلم", category: "العلم" },
    { id: 3, text: "«لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»", narrator: "رواه البخاري", category: "الأخلاق والمعاملات" },
    { id: 4, text: "«عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ»", narrator: "رواه مسلم", category: "الأخلاق والمعاملات" },
    { id: 5, text: "«بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ...»", narrator: "رواه البخاري ومسلم", category: "العقيدة والنية" },
    { id: 6, text: "«مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»", narrator: "رواه البخاري", category: "الأخلاق والمعاملات" }
  ];

  const categories = ["الكل", "العقيدة والنية", "العلم", "الأخلاق والمعاملات"];
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [copiedId, setCopiedId] = useState(null);
  const [randomHadith, setRandomHadith] = useState(null);

  const filteredHadiths = selectedCategory === "الكل" 
    ? hadithData 
    : hadithData.filter(h => h.category === selectedCategory);

  const handleCopy = (text, id, narrator) => {
    navigator.clipboard.writeText(`${text} [${narrator}]`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showRandomHadith = () => {
    const randomIndex = Math.floor(Math.random() * hadithData.length);
    setRandomHadith(hadithData[randomIndex]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 text-right relative" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="bg-gray-800 text-gray-300 hover:text-white px-5 py-2 rounded-xl border border-gray-700 hover:border-gray-500 transition-all font-bold">
            ⬅ عودة للرئيسية
          </Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500 font-arabic">
            ركن الحديث النبوي الشريف
          </h1>
        </div>
        <button 
          onClick={showRandomHadith}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-all cursor-pointer transform hover:scale-105"
        >
          🎲 عرض حديث عشوائي
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-800/40 p-2 rounded-xl border border-gray-800 w-fit">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHadiths.map((hadith) => (
          <div 
            key={hadith.id} 
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 group"
          >
            <div>
              <span className="text-xs bg-gray-900 text-blue-400 px-3 py-1 rounded-full font-bold border border-gray-700">
                {hadith.category}
              </span>
              <p className="text-xl font-arabic leading-loose text-amber-100 my-6 text-center group-hover:text-white transition-all">
                {hadith.text}
              </p>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-700/60 pt-4 mt-2">
              <span className="text-xs text-teal-400 font-bold bg-teal-500/5 px-2 py-1 rounded">📜 {hadith.narrator}</span>
              <button 
                onClick={() => handleCopy(hadith.text, hadith.id, hadith.narrator)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedId === hadith.id ? "✅ تم نسخ النص" : "📋 نسخ الحديث"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة الحديث العشوائي المنبثقة */}
      {randomHadith && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gray-800 p-6 md:p-8 rounded-2xl border-2 border-blue-500 max-w-lg w-full shadow-2xl relative text-center">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 mb-4 font-arabic">✨ حديث اليوم التنشيطي</h3>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-4">
              <p className="text-2xl font-arabic text-amber-100 leading-loose">"{randomHadith.text}"</p>
              <p className="text-sm text-gray-400 mt-4">📜 {randomHadith.narrator}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => handleCopy(randomHadith.text, 'rand', randomHadith.narrator)} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
              >
                {copiedId === 'rand' ? "✅ تم النسخ" : "📋 نسخ الحديث"}
              </button>
              <button 
                onClick={() => setRandomHadith(null)} 
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hadith;