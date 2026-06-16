import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Quran = () => {
  // حالات إدارة البيانات
  const [surahs, setSurahs] = useState([]);
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(true); // للتحكم في شاشة البداية
  
  // ميزات التحكم والعرض
  const [hideVerses, setHideVerses] = useState(false);
  const [activeVerseId, setActiveVerseId] = useState(null);
  const [selectedTafsir, setSelectedTafsir] = useState('');
  const [bookmark, setBookmark] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false); // إظهار/إخفاء الشاشة الصغيرة العائمة
  
  // البحث الحديث
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // الصوتيات
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(new Audio());

  // التسميع الصوتي والذكاء الاصطناعي
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const recognitionRef = useRef(null);

  const verseRefs = useRef({});

  // تنظيف النص العربي للمقارنة والبحث
  const normalizeArabic = (str) => {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  };

  // جلب قائمة السور في البداية
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => setSurahs(data.data))
      .catch(err => console.error("خطأ في جلب السور:", err));

    const savedBookmark = localStorage.getItem('quran_bookmark');
    if (savedBookmark) {
      const parsed = JSON.parse(savedBookmark);
      setBookmark(parsed);
    }
  }, []);

  // جلب الآيات والتفسير بطلب واحد مدمج (لحل مشكلة التحميل)
  useEffect(() => {
    if (isSetupMode) return; // لا تحمل الآيات إلا بعد الدخول
    
    setLoading(true);
    // جلب النص العثماني والتفسير الميسر في مسار واحد
    fetch(`https://api.alquran.cloud/v1/surah/${currentSurahId}/editions/quran-uthmani,ar.muyassar`)
      .then(res => res.json())
      .then(data => {
        const textVerses = data.data[0].verses;
        const tafsirVerses = data.data[1].verses;
        
        const combinedVerses = textVerses.map((verse, index) => ({
          ...verse,
          tafsir: tafsirVerses[index].text
        }));
        
        setVerses(combinedVerses);
        setLoading(false);

        if (bookmark && bookmark.surahId === currentSurahId) {
          setTimeout(() => {
            verseRefs.current[bookmark.verseNumber]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      })
      .catch(err => {
        console.error("خطأ في جلب الآيات:", err);
        setLoading(false);
      });
  }, [currentSurahId, isSetupMode]);

  // إعدادات التعرف على الصوت
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-SA';

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (activeVerseId !== null) {
          const currentVerse = verses.find(v => v.numberInSurah === activeVerseId);
          if (currentVerse) {
            const cleanTarget = normalizeArabic(currentVerse.text);
            const cleanUser = normalizeArabic(currentTranscript);

            if (cleanTarget === cleanUser || cleanTarget.includes(cleanUser)) {
              setIsCorrect(true);
            } else {
              setIsCorrect(false); 
            }
          }
        }
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [activeVerseId, verses]);

  const toggleRecording = (verseNumber) => {
    if (!recognitionRef.current) {
      alert("متصفحك لا يدعم التسميع الصوتي.");
      return;
    }
    setActiveVerseId(verseNumber);
    setShowAssistant(true); // إظهار المساعد العائم تلقائياً عند التسميع

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setIsCorrect(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleJuzChange = (juzNumber) => {
    if (!juzNumber) return;
    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`)
      .then(res => res.json())
      .then(data => {
        if (data.data.verses.length > 0) {
          const firstVerse = data.data.verses[0];
          setCurrentSurahId(firstVerse.surah.number);
          setBookmark({ surahId: firstVerse.surah.number, verseNumber: firstVerse.numberInSurah });
        }
      })
      .catch(err => console.error(err));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    fetch(`https://api.alquran.cloud/v1/search/${searchQuery}/all/ar`)
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.data.matches || []);
        setIsSearching(false);
      })
      .catch(err => {
        console.error(err);
        setIsSearching(false);
      });
  };

  const playAudio = (verseId) => {
    if (playingAudio === verseId) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${verseId}.mp3`;
      audioRef.current.play();
      setPlayingAudio(verseId);
      audioRef.current.onended = () => setPlayingAudio(null);
    }
  };

  const handleSetBookmark = (verse) => {
    const newBookmark = { surahId: currentSurahId, verseNumber: verse.numberInSurah };
    setBookmark(newBookmark);
    localStorage.setItem('quran_bookmark', JSON.stringify(newBookmark));
  };

  // ================= شاشة البداية والاختيار المسبق =================
  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-black text-white font-sans p-6 text-right flex flex-col items-center justify-center relative overflow-hidden" dir="rtl">
        {/* خلفية بتأثير النيون */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-gray-900 to-black z-0"></div>
        <div className="absolute w-96 h-96 bg-green-500/10 blur-[100px] rounded-full top-1/4 left-1/4 z-0"></div>
        <div className="absolute w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full bottom-1/4 right-1/4 z-0"></div>

        <div className="z-10 bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl border border-green-500/30 shadow-[0_0_30px_rgba(0,255,128,0.15)] w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-arabic text-center mb-8">
            المصحف التفاعلي الشامل
          </h1>
          
          <div className="space-y-6">
            {/* السورة */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-green-400 font-bold">اختر السورة للبدء:</label>
              <select 
                className="bg-black text-white p-3 rounded-lg border border-gray-700 focus:border-green-500 outline-none transition-all font-arabic"
                value={currentSurahId}
                onChange={(e) => setCurrentSurahId(Number(e.target.value))}
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>{s.number} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* الجزء */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-blue-400 font-bold">أو اختر الجزء:</label>
              <select 
                className="bg-black text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition-all"
                onChange={(e) => handleJuzChange(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>-- اختر الجزء --</option>
                {Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>الجزء {i + 1}</option>
                ))}
              </select>
            </div>

            {/* زر الدخول */}
            <button 
              onClick={() => setIsSetupMode(false)}
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold text-lg p-4 rounded-xl shadow-[0_0_20px_rgba(0,255,128,0.3)] transition-all transform hover:scale-[1.02]"
            >
              📖 الدخول للمصحف
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= شاشة المصحف (القراءة والتسميع) =================
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans p-4 md:p-6 text-right relative" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <button 
          onClick={() => setIsSetupMode(true)} 
          className="bg-gray-900 text-blue-400 hover:text-white px-4 py-2 rounded-xl border border-gray-800 hover:border-blue-500 transition-all text-sm font-bold shadow-md"
        >
          ⬅ عودة للاختيار
        </button>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAssistant(!showAssistant)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${showAssistant ? 'bg-blue-600 text-white' : 'bg-gray-900 text-blue-400 border border-gray-800'}`}
          >
            {showAssistant ? '✖ إغلاق المساعد' : '💡 المساعد والتفسير'}
          </button>
          
          <button 
            onClick={() => setHideVerses(!hideVerses)} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${hideVerses ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(0,255,128,0.4)]' : 'bg-gray-900 text-green-400 border border-gray-800'}`}
          >
            {hideVerses ? '👁️ إظهار الآيات' : '🙈 إخفاء الآيات'}
          </button>
        </div>
      </div>

      {/* مساحة المصحف (بكامل العرض الشاشة) */}
      <div className="w-full bg-gray-950/50 p-4 md:p-8 rounded-2xl border border-gray-900 shadow-2xl">
        {loading ? (
          <div className="text-center py-32 text-green-500 text-xl animate-pulse">جاري تحميل كلام الله... ✨</div>
        ) : (
          <div className="space-y-6 leading-loose tracking-wide">
            {/* البسملة */}
            {currentSurahId !== 1 && currentSurahId !== 9 && (
              <div className="text-center text-2xl font-arabic text-green-400 my-6 drop-shadow-md">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            )}

            {/* الآيات بحجم خط أصغر وأكثر تناسقاً */}
            <div className="flex flex-wrap justify-center text-right font-arabic text-xl md:text-2xl gap-x-2 gap-y-5">
              {verses.map((verse) => {
                const isBookmarked = bookmark && bookmark.surahId === currentSurahId && bookmark.verseNumber === verse.numberInSurah;
                const isActive = activeVerseId === verse.numberInSurah;

                return (
                  <span 
                    key={verse.number} 
                    ref={el => verseRefs.current[verse.numberInSurah] = el}
                    className={`inline-block p-1.5 rounded-lg transition-all duration-300 relative group ${
                      isBookmarked ? 'bg-blue-900/30 border border-blue-500/50 text-blue-100' : ''
                    } ${isActive ? 'bg-gray-800/80 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'hover:bg-gray-900/60'}`}
                  >
                    <span 
                      onClick={() => {
                        setActiveVerseId(verse.numberInSurah);
                        setSelectedTafsir(verse.tafsir);
                        setShowAssistant(true);
                      }}
                      className={`cursor-pointer transition-all selection:bg-green-500/30 ${
                        hideVerses && !isActive ? 'bg-gray-800 text-gray-800 select-none blur-[4px] opacity-30' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      {verse.text}
                    </span>

                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-700 text-[10px] text-green-500 font-sans mr-1 ml-2 bg-black">
                      {verse.numberInSurah}
                    </span>

                    {/* الأدوات السريعة */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black px-3 py-1.5 rounded-lg border border-gray-800 shadow-2xl hidden group-hover:flex gap-3 z-10 text-sm font-sans w-max">
                      <button onClick={() => playAudio(verse.number)} className="hover:text-blue-400 transition-colors">
                        {playingAudio === verse.number ? '⏸️' : '🔊 استماع'}
                      </button>
                      <button onClick={() => handleSetBookmark(verse)} className="hover:text-amber-400 transition-colors">
                        📌 {isBookmarked ? 'محفوظ' : 'فاصل'}
                      </button>
                      <button onClick={() => toggleRecording(verse.numberInSurah)} className="hover:text-red-400 transition-colors">
                        🎙️ تسميع
                      </button>
                    </div>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* الشاشة الصغيرة المنبثقة (المساعد الذكي والتفسير) */}
      {showAssistant && (
        <div className="fixed bottom-6 left-6 w-[350px] bg-black/95 backdrop-blur-xl border-2 border-gray-800 rounded-2xl shadow-[0_0_30px_rgba(0,255,128,0.15)] p-5 z-50 flex flex-col gap-4">
          
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-green-400">💡 المساعد والتفسير</h3>
            <button onClick={() => setShowAssistant(false)} className="text-gray-500 hover:text-red-500">✖</button>
          </div>

          {activeVerseId ? (
            <div className="space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
              
              {/* قسم التسميع */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">تسميع الآية {activeVerseId}</span>
                  <button 
                    onClick={() => toggleRecording(activeVerseId)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                      isRecording ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500' : 'bg-black border border-green-500 text-green-500 hover:scale-105 shadow-[0_0_10px_rgba(0,255,128,0.2)]'
                    }`}
                  >
                    🎤
                  </button>
                </div>

                {transcript && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">نطقك:</p>
                    {/* اللون يتغير للأخضر في حال الصح، وللأحمر في حال الخطأ */}
                    <p className={`font-arabic text-md ${
                        isCorrect === true ? 'text-green-500 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]' 
                        : isCorrect === false ? 'text-red-500 drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]' 
                        : 'text-gray-300'
                      }`}
                    >
                      "{transcript}"
                    </p>
                    
                    {isCorrect === true && <span className="text-xs text-green-400 block mt-2 font-bold">✔️ قراءة صحيحة</span>}
                    {isCorrect === false && <span className="text-xs text-red-400 block mt-2 font-bold">❌ انتبه للخطأ</span>}
                  </div>
                )}
              </div>

              {/* قسم التفسير */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <span className="text-xs text-blue-400 font-bold block mb-2">تفسير الآية {activeVerseId}:</span>
                <p className="text-sm text-gray-300 leading-relaxed text-justify font-sans">{selectedTafsir}</p>
              </div>

            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-8">اضغط على أي آية في المصحف ليظهر لك التفسير أو لتبدأ التسميع.</p>
          )}
        </div>
      )}

    </div>
  );
};

export default Quran;