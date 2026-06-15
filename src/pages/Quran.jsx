import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Quran = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCorrect, setIsCorrect] = useState(null); // حالة التحقق من التسميع
  const recognitionRef = useRef(null);

  const quranVerses = [
    { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", info: "الفاتحة - آية 1" },
    { text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", info: "الفاتحة - آية 2" },
    { text: "الرَّحْمَنِ الرَّحِيمِ", info: "الفاتحة - آية 3" },
    { text: "مَالِكِ يَوْمِ الدِّينِ", info: "الفاتحة - آية 4" },
    { text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", info: "الفاتحة - آية 5" },
    { text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", info: "الفاتحة - آية 6" },
    { text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", info: "الفاتحة - آية 7" }
  ];
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  // دالة ذكية لتنظيف النص العربي من التشكيل والهمزات لإجراء مقارنة عادلة
  const normalizeArabic = (str) => {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u0652]/g, "") // حذف التشكيل (الفتحة، الضمة، الكسرة، السكون...)
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  };

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

        // مقارنة حية أثناء النطق
        const currentVerseClean = normalizeArabic(quranVerses[currentVerseIndex].text);
        const userSpeechClean = normalizeArabic(currentTranscript);

        if (currentVerseClean === userSpeechClean || userSpeechClean.includes(currentVerseClean)) {
          setIsCorrect(true);
        } else {
          setIsCorrect(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("خطأ المايكروفون:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [currentVerseIndex]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("عذراً! متصفحك الحالي لا يدعم ميزة التسميع الصوتي الذكي. يرجى فتح المنصة من متصفح Google Chrome أو Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setIsCorrect(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < quranVerses.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
      setTranscript('');
      setIsCorrect(null);
    }
  };

  const handlePrevVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
      setTranscript('');
      setIsCorrect(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <Link to="/" className="bg-gray-800 text-gray-300 hover:text-white px-5 py-2 rounded-xl border border-gray-700 hover:border-gray-500 transition-all font-bold">
          ⬅ عودة للرئيسية
        </Link>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-arabic">
          ركن القرآن الكريم التفاعلي
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">📖 تلاوة وتدبر الآيات</h2>
            <div className="bg-gray-900 p-8 rounded-xl text-center border border-gray-700 min-h-64 flex flex-col items-center justify-center relative">
              <span className="absolute top-3 right-4 text-xs text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full">
                {quranVerses[currentVerseIndex].info}
              </span>
              <p className="text-3xl font-arabic leading-loose text-amber-100 px-4">
                "{quranVerses[currentVerseIndex].text}"
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-6 gap-4">
            <button onClick={handlePrevVerse} disabled={currentVerseIndex === 0} className={`px-6 py-3 rounded-xl font-bold transition-all w-1/2 text-center border ${currentVerseIndex === 0 ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'}`}>
              الآية السابقة
            </button>
            <button onClick={handleNextVerse} disabled={currentVerseIndex === quranVerses.length - 1} className={`px-6 py-3 rounded-xl font-bold transition-all w-1/2 text-center ${currentVerseIndex === quranVerses.length - 1 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-md'}`}>
              الآية التالية
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">🎙️ مساعد التسميع والمراجعة الذكي</h2>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              فعّل المايكروفون وابدأ في قراءة محفوظك غيباً؛ سيقوم النظام بمقارنة قراءتك بالرسم العثماني مباشرة وتلوين النتيجة.
            </p>
            
            <div className="flex flex-col items-center justify-center py-4">
              <button onClick={toggleRecording} className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-300 shadow-lg ${isRecording ? 'bg-red-600 animate-pulse border-2 border-red-400' : 'bg-gray-700 border-2 border-green-500 hover:scale-105'}`}>
                🎤
              </button>
              <span className="mt-4 text-sm font-bold text-gray-400">
                {isRecording ? 'جاري الاستماع لترتيلك المبارك...' : 'اضغط وابدأ التسميع غيباً'}
              </span>
            </div>
          </div>

          <div className={`mt-4 p-5 rounded-xl border-2 border-dashed min-h-[110px] flex flex-col items-center justify-center text-xl font-arabic leading-relaxed transition-all ${isCorrect === true ? 'bg-green-950/40 border-green-500 text-green-400' : isCorrect === false ? 'bg-amber-950/20 border-amber-600/50 text-amber-300' : 'bg-gray-900 border-gray-700 text-gray-500 text-sm'}`}>
            {transcript ? (
              <>
                <span className="text-center">"{transcript}"</span>
                {isCorrect === true && <span className="text-xs bg-green-500 text-gray-900 px-3 py-1 rounded-full font-bold mt-2 font-sans">✔️ أحسنت، تسميعك صحيح ومطابق!</span>}
                {isCorrect === false && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold mt-2 font-sans">⏳ تابع القراءة لإتمام الآية بدقة...</span>}
              </>
            ) : (
              <span>الآيات التي ستنطق بها ستُكتب هنا تلقائياً لمراجعتها...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quran;