import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Quran = () => {
  // حالات إدارة البيانات
  const [surahs, setSurahs] = useState([]); // قائمة كل السور
  const [currentSurahId, setCurrentSurahId] = useState(1); // السورة الحالية (الافتراضية: الفاتحة)
  const [verses, setVerses] = useState([]); // آيات السورة الحالية
  const [loading, setLoading] = useState(false);
  
  // ميزات التحكم والعرض
  const [hideVerses, setHideVerses] = useState(false); // إخفاء وإظهار الآيات
  const [activeVerseId, setActiveVerseId] = useState(null); // الآية المحددة للتفسير أو القراءة
  const [selectedTafsir, setSelectedTafsir] = useState(''); // نص التفسير الحالي
  const [bookmark, setBookmark] = useState(null); // الفاصل (حفظ الآية)
  
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

  // مراجع لتسهيل عمل السكرول التلقائي للآيات
  const verseRefs = useRef({});

  // تنظيف النص العربي للمقارنة والبحث العادل
  const normalizeArabic = (str) => {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u0652]/g, "") // حذف التشكيل بالكامل
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  };

  // 1. جلب قائمة السور كلها عند تحميل المكون
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => setSurahs(data.data))
      .catch(err => console.error("خطأ في جلب السور:", err));

    // استعادة الفاصل المحفوظ من الذاكرة المحلية
    const savedBookmark = localStorage.getItem('quran_bookmark');
    if (savedBookmark) {
      const parsed = JSON.parse(savedBookmark);
      setBookmark(parsed);
      setCurrentSurahId(parsed.surahId);
    }
  }, []);

  // 2. جلب آيات السورة المحددة مع التفسير الميسر
  useEffect(() => {
    setLoading(true);
    // جلب النص العثماني والترجمة/التفسير الميسر في طلب واحد مدمج
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${currentSurahId}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/surah/${currentSurahId}/ar.muyassar`)
    ])
      .then(([resText, resTafsir]) => Promise.all([resText.json(), resTafsir.json()]))
      .then(([dataText, dataTafsir]) => {
        const combinedVerses = dataText.data.verses.map((verse, index) => ({
          ...verse,
          tafsir: dataTafsir.data.verses[index].text
        }));
        setVerses(combinedVerses);
        setLoading(false);

        // إذا كان هناك فاصل محفوظ لهذه السورة، اذهب إليه تلقائياً بعد التحميل
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
  }, [currentSurahId]);

  // 3. إعدادات التعرف على الصوت التسميع الذكي
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
              setIsCorrect(false); // هنا يتم كشف الخطأ تزامناً مع القراءة
            }
          }
        }
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [activeVerseId, verses]);

  // تفعيل وإيقاف التسميع الصوتي
  const toggleRecording = (verseNumber) => {
    if (!recognitionRef.current) {
      alert("متصفحك لا يدعم التسميع الصوتي، يرجى استخدام متصفح Chrome.");
      return;
    }
    setActiveVerseId(verseNumber);

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setIsCorrect(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // 4. دالة الانتقال بالجزء إلى أول آية فيه
  const handleJuzChange = (juzNumber) => {
    if (!juzNumber) return;
    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`)
      .then(res => res.json())
      .then(data => {
        if (data.data.verses.length > 0) {
          const firstVerse = data.data.verses[0];
          // الانتقال للسورة التي يبدأ بها الجزء وتحديد الآية الأولى
          setCurrentSurahId(firstVerse.surah.number);
          setBookmark({ surahId: firstVerse.surah.number, verseNumber: firstVerse.numberInSurah });
        }
      })
      .catch(err => console.error(err));
  };

  // 5. محرك البحث الحديث بالآيات أو السور
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

  // 6. تشغيل صوت الآية لأي قارئ (افتراضي: العفاسي)
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

  // 7. وضع فاصل (حفظ ومظهر مخصص)
  const handleSetBookmark = (verse) => {
    const newBookmark = { surahId: currentSurahId, verseNumber: verse.numberInSurah };
    setBookmark(newBookmark);
    localStorage.setItem('quran_bookmark', JSON.stringify(newBookmark));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 md:p-6 text-right" dir="rtl">
      
      {/* الهيدر والعنوان الرئيسي */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-6 border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="bg-gray-800 text-gray-300 hover:text-white px-4 py-2 rounded-xl border border-gray-700 transition-all text-sm font-bold">
            ⬅ الرئيسية
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 font-arabic">
            المصحف التفاعلي الشامل ونظام التسميع
          </h1>
        </div>

        {/* أزرار التحكم السريع والإخفاء */}
        <div className="flex gap-2 bg-gray-800 p-1.5 rounded-xl border border-gray-700 w-full lg:w-auto justify-center">
          <button 
            onClick={() => setHideVerses(!hideVerses)} 
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${hideVerses ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {hideVerses ? '👁️ إظهار الآيات الحالية' : '🙈 إخفاء الآيات للاختبار'}
          </button>
        </div>
      </div>

      {/* شريط الأدوات: اختيار السور، الأجزاء والبحث */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* اختيار السورة */}
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-1">
          <label className="text-xs text-emerald-400 font-bold">اختر السورة:</label>
          <select 
            className="bg-gray-900 text-white p-2 rounded-lg border border-gray-700 font-arabic"
            value={currentSurahId}
            onChange={(e) => setCurrentSurahId(Number(e.target.value))}
          >
            {surahs.map(s => (
              <option key={s.number} value={s.number}>{s.number} - {s.name}</option>
            ))}
          </select>
        </div>

        {/* اختيار الجزء */}
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-1">
          <label className="text-xs text-emerald-400 font-bold">انتقل للجزء (سيذهب لأول آية):</label>
          <select 
            className="bg-gray-900 text-white p-2 rounded-lg border border-gray-700"
            onChange={(e) => handleJuzChange(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- اختر الجزء --</option>
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>الجزء {i + 1}</option>
            ))}
          </select>
        </div>

        {/* محرك البحث المتطور */}
        <form onSubmit={handleSearch} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-1">
          <label className="text-xs text-emerald-400 font-bold">البحث الحديث بالآيات والكلمات:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="اكتب كلمة أو آية للبحث..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-900 text-white p-2 rounded-lg border border-gray-700 text-sm flex-grow"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-4 rounded-lg text-sm font-bold">بحث</button>
          </div>
        </form>
      </div>

      {/* لوحة عرض نتائج البحث السريع */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800 border border-teal-500/40 p-4 rounded-xl mb-6 max-h-60 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
            <h3 className="text-sm font-bold text-teal-400">🔍 نتائج البحث ({searchResults.length}):</h3>
            <button onClick={() => setSearchResults([])} className="text-xs text-red-400 hover:underline">إغلاق النتائج</button>
          </div>
          <div className="space-y-3">
            {searchResults.map((result, idx) => (
              <div 
                key={idx} 
                className="bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-emerald-500 cursor-pointer transition-all"
                onClick={() => {
                  setCurrentSurahId(result.surah.number);
                  setBookmark({ surahId: result.surah.number, verseNumber: result.numberInSurah });
                  setSearchResults([]);
                }}
              >
                <p className="font-arabic text-amber-100 text-lg mb-1">"{result.text}"</p>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  سورة {result.surah.name} | آية رقم {result.numberInSurah} | الجزء {result.juz}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* محتوى المصحف والتفاعلات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيمن والأوسط: عرض نص المصحف الشريف */}
        <div className="lg:col-span-2 bg-gray-800 p-4 md:p-6 rounded-2xl border border-gray-700 shadow-2xl">
          {loading ? (
            <div className="text-center py-20 text-gray-400">جاري تحميل كلام الله المبارك... ✨</div>
          ) : (
            <div className="space-y-6 leading-loose tracking-wide">
              {/* البسملة */}
              {currentSurahId !== 1 && currentSurahId !== 9 && (
                <div className="text-center text-2xl font-arabic text-amber-200 my-4">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
              )}

              {/* بناء عرض الآيات المتجاوب */}
              <div className="flex flex-wrap justify-center text-right font-arabic text-2xl md:text-3xl gap-x-2 gap-y-4">
                {verses.map((verse) => {
                  const isBookmarked = bookmark && bookmark.surahId === currentSurahId && bookmark.verseNumber === verse.numberInSurah;
                  const isActive = activeVerseId === verse.numberInSurah;

                  return (
                    <span 
                      key={verse.number} 
                      ref={el => verseRefs.current[verse.numberInSurah] = el}
                      className={`inline-block p-2 rounded-xl transition-all duration-300 relative group ${
                        isBookmarked ? 'bg-amber-950/40 border border-amber-600/50 shadow-md text-amber-100' : ''
                      } ${isActive ? 'bg-slate-700/50' : 'hover:bg-gray-700/40'}`}
                    >
                      {/* التحكم في الإخفاء والإظهار طبقاً لرغبتك */}
                      <span 
                        onClick={() => {
                          setActiveVerseId(verse.numberInSurah);
                          setSelectedTafsir(verse.tafsir);
                        }}
                        className={`cursor-pointer transition-all selection:bg-emerald-500 ${
                          hideVerses && !isActive ? 'bg-gray-700 text-gray-700 select-none blur-[4px]' : 'text-gray-100'
                        }`}
                      >
                        {verse.text}
                      </span>

                      {/* رقم الآية الدائري وأدوات التحكم الفورية */}
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-amber-500/60 text-xs text-amber-400 font-sans mr-1 ml-2 bg-gray-900">
                        {verse.numberInSurah}
                      </span>

                      {/* شريط أدوات سريع يظهر عند مرور الماوس فوق الآية */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-950 px-2 py-1 rounded-lg border border-gray-700 shadow-xl hidden group-hover:flex gap-2 z-10 text-xs font-sans">
                        <button onClick={() => playAudio(verse.number)} className="hover:text-emerald-400">
                          {playingAudio === verse.number ? '⏸️' : '🔊 استماع'}
                        </button>
                        <button onClick={() => handleSetBookmark(verse)} className="hover:text-amber-400">
                          📌 {isBookmarked ? 'محفوظ' : 'فاصل'}
                        </button>
                        <button onClick={() => toggleRecording(verse.numberInSurah)} className="hover:text-red-400">
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

        {/* العمود الأيسر: شاشة ذكية لعرض (التفسير الموثق ومساعد التسميع) */}
        <div className="space-y-6">
          
          {/* لوحة التسميع والمراجعة الذكية للخطأ والصواب */}
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-md font-bold text-emerald-400 mb-3 flex items-center gap-2">🎙️ مساعد التسميع والتحقق الآلي</h2>
            {activeVerseId ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  أنت تسجل الآن لاختبار الآية رقم <span className="text-amber-400 font-bold">{activeVerseId}</span>
                </p>
                <div className="flex justify-center">
                  <button 
                    onClick={() => toggleRecording(activeVerseId)} 
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                      isRecording ? 'bg-red-600 animate-pulse border-2 border-red-400' : 'bg-gray-700 border-2 border-emerald-500 hover:scale-105'
                    }`}
                  >
                    🎤
                  </button>
                </div>

                {/* نظام التحليل للخطأ والصواب الذكي بناء على حالة الإخفاء */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 min-h-24 flex flex-col justify-center">
                  {transcript ? (
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-gray-400">نطقك الحالي:</p>
                      <p className="font-arabic text-lg text-amber-200">"{transcript}"</p>
                      
                      {/* الشرط المطلوب: لو مخفية يوضح الخطأ والصواب بالتفصيل، لو عادية يوضح النتيجة مباشرة */}
                      {hideVerses ? (
                        <div className="mt-2 border-t border-gray-800 pt-2 text-xs">
                          {isCorrect ? (
                            <span className="text-emerald-400 font-bold block">✔️ قراءتك ممتازة ومطابقة للرسم العثماني!</span>
                          ) : (
                            <div className="text-right space-y-1">
                              <span className="text-amber-500 font-bold block">⏳ تنبيه بوجود اختلاف في القراءة:</span>
                              <p className="text-red-400">قراءتك: {transcript}</p>
                              <p className="text-emerald-400">الآية الصحيحة: {verses.find(v => v.numberInSurah === activeVerseId)?.text}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          {isCorrect ? (
                            <span className="bg-emerald-500 text-gray-900 font-bold px-3 py-1 rounded-full text-xs">قراءة صحيحة ✔️</span>
                          ) : (
                            <span className="bg-red-500 text-white font-bold px-3 py-1 rounded-full text-xs">خطأ أو غير مكتملة ❌</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 text-center">اضغط على المايك وابدأ القراءة غيباً لتصحيح خطأك تلقائياً...</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">اضغط على أي آية ثم اختر (🎙️ تسميع) لبدء تصحيح الحفظ</p>
            )}
          </div>

          {/* لوحة التفسير الميسر الموثق */}
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-md font-bold text-amber-400 mb-3 flex items-center gap-2">📖 التفسير الميسر المعتمد</h2>
            {selectedTafsir ? (
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                <span className="text-xs text-emerald-400 font-bold block mb-2">تفسير الآية {activeVerseId}:</span>
                <p className="text-sm text-gray-200 leading-relaxed text-justify font-sans">{selectedTafsir}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">اضغط على أي آية في المصحف لقراءة تفسيرها الموثق فوراً.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Quran;