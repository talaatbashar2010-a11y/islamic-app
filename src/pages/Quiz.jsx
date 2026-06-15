import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const Quiz = () => {
  const [step, setStep] = useState('register'); 
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState({ name: '', phone: '' });
  
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const docSnap = await getDoc(doc(db, 'quiz_config', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        if (!data.isOpen) setStep('closed');
      } else {
        setStep('closed');
      }
    };
    init();
  }, []);

  // عداد الوقت الذكي
  useEffect(() => {
    if (step !== 'playing') return;

    if (timeLeft === 0) {
      handleAnswer(null); 
      return;
    }

    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, step]);

  // نظام ضد الغش المطور (يكتشف الخروج من التبويب أو تصغير المتصفح)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && step === 'playing') {
        setScore((prev) => Math.max(0, prev - 10)); // خصم 10 نقاط دون النزول تحت الصفر
        alert('🚨 تنبيه أمني: تم الخروج من صفحة الاختبار! تم خصم 10 نقاط من رصيدك كعقوبة غش.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [step]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user.name.trim() || !user.phone.trim()) return alert('يرجى إدخال البيانات المطلوبة كاملة');

    const userRef = doc(db, 'quiz_participants', user.phone.trim());
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return alert('عذراً، لقد شاركت في هذه المسابقة مسبقاً بهذا الرقم!');
    }

    const qSnap = await getDocs(collection(db, 'quiz_questions'));
    let allQuestions = [];
    qSnap.forEach(d => allQuestions.push({ id: d.id, ...d.data() }));

    if (allQuestions.length === 0) return alert('لا توجد أسئلة متوفرة حالياً، تواصل مع الإدارة.');

    const limit = config?.questionsPerUser || 5;
    const shuffledQuestions = shuffleArray(allQuestions).slice(0, limit);
    
    const preparedQuestions = shuffledQuestions.map(q => {
      const options = shuffleArray([q.correct, ...q.wrongs]);
      return { ...q, options };
    });

    setQuestions(preparedQuestions);
    setStep('playing');
    setTimeLeft(10);
  };

  const handleAnswer = async (selectedOption) => {
    if (isSubmitting) return;

    const currentQ = questions[currentQIndex];
    const isCorrect = selectedOption === currentQ.correct;
    let updatedScore = score;
    
    if (isCorrect) {
      updatedScore += 10;
      setScore(updatedScore);
    }

    const answerRecord = {
      question: currentQ.text,
      userAnswer: selectedOption || 'لم يجب (انتهى الوقت)',
      correctAnswer: currentQ.correct,
      isCorrect
    };
    
    const newAnswersList = [...userAnswers, answerRecord];
    setUserAnswers(newAnswersList);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(10); 
    } else {
      // نهاية المسابقة وحفظ النتيجة بشكل آمن
      setIsSubmitting(true);
      setStep('results');
      try {
        await setDoc(doc(db, 'quiz_participants', user.phone.trim()), {
          name: user.name.trim(),
          phone: user.phone.trim(),
          score: updatedScore,
          answers: newAnswersList,
          timestamp: new Date()
        });
      } catch (err) {
        console.error("Error saving score:", err);
      }
      setIsSubmitting(false);
    }
  };

  if (step === 'closed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white text-center" dir="rtl">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md shadow-xl">
          <h1 className="text-4xl font-bold text-red-500 mb-4">المشاركة مغلقة حالياً 🚫</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">عذراً، المسابقة مغلقة بطلب من الإدارة أو لم تبدأ بعد. تابع قنواتنا لتعرف موعد الانطلاق القادم!</p>
          <Link to="/" className="bg-gray-700 px-6 py-3 rounded-xl border border-gray-600 hover:bg-gray-600 block transition-all font-bold">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white text-right" dir="rtl">
        <form onSubmit={handleRegister} className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">🏆 الدخول للمسابقة التفاعلية</h2>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="الاسم الثلاثي الكريم" value={user.name} onChange={(e)=>setUser({...user, name: e.target.value})} className="p-4 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
            <input type="tel" placeholder="رقم الهاتف (للتواصل معك في حال الفوز)" value={user.phone} onChange={(e)=>setUser({...user, phone: e.target.value})} className="p-4 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center" dir="ltr" required />
            <div className="text-sm text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 leading-relaxed">
              ⚠️ <b>تنبيه هام جداً:</b> <br/>
              • وقت الإجابة على كل سؤال هو <b>10 ثوانٍ</b> فقط.<br/>
              • الخروج من الصفحة أو التنقل بين التطبيقات يعرضك لخصم <b>10 نقاط تلقائياً</b>.
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold p-4 rounded-xl mt-2 shadow-lg transition-all text-lg">ابدأ التحدي الآن</button>
            <Link to="/" className="text-center text-gray-400 hover:text-white mt-2 text-sm transition-all">عودة للرئيسية</Link>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'playing') {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return <div className="text-white text-center p-10">جاري تهيئة الأسئلة...</div>;

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white text-right" dir="rtl">
        <div className="w-full max-w-2xl bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <span className="text-gray-400 font-bold">السؤال {currentQIndex + 1} من {questions.length}</span>
            <span className={`text-lg font-bold px-4 py-1 rounded-full border transition-all ${timeLeft <= 3 ? 'bg-red-600 border-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-blue-600 border-blue-500'}`}>
              ⏳ {timeLeft} ثانية
            </span>
            <span className="text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-lg">النقاط: {score}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-center leading-relaxed mb-8 min-h-[60px] text-gray-100">{currentQ.text}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ.options.map((option, idx) => (
              <button 
                key={idx} 
                onClick={() => handleAnswer(option)}
                className="bg-gray-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 border border-gray-600 hover:border-blue-400 p-4 rounded-xl text-lg font-semibold text-right transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white flex flex-col items-center py-10 text-right" dir="rtl">
        <div className="w-full max-w-3xl">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-green-400">🎉 مبارك إتمام المسابقة!</h1>
            <p className="text-gray-400 text-lg mb-6">تقبل الله منك ومستعدون لإعلان الفائزين قريباً يا {user.name}</p>
            <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 animate-bounce">
              {score} نقطة
            </div>
            <Link to="/" className="inline-block mt-4 bg-gray-700 border border-gray-600 hover:bg-gray-600 px-8 py-3 rounded-xl font-bold transition-all shadow-md">العودة للرئيسية</Link>
          </div>

          <h3 className="text-xl font-bold mb-4 text-blue-400 border-r-4 border-blue-500 pr-3">مراجعة إجاباتك العلمية:</h3>
          <div className="flex flex-col gap-4">
            {userAnswers.map((ans, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border transition-all ${ans.isCorrect ? 'bg-green-950/30 border-green-500/50' : 'bg-red-950/30 border-red-500/50'}`}>
                <p className="font-bold mb-3 text-lg text-gray-100">{idx + 1}. {ans.question}</p>
                <div className="text-sm space-y-1">
                  <p className="text-gray-300">إجابتك: <span className={ans.isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{ans.userAnswer}</span></p>
                  {!ans.isCorrect && <p className="text-green-400 mt-1">الإجابة الصحيحة هي: <span className="font-bold">{ans.correctAnswer}</span></p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
};

export default Quiz;