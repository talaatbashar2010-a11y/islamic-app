import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore'; // تم إضافة deleteDoc

const AdminQuiz = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState({ isOpen: false, questionsPerUser: 5 });
  const [participants, setParticipants] = useState([]);
  const [questionsList, setQuestionsList] = useState([]); // قائمة الأسئلة المستدعاة
  const [loading, setLoading] = useState(false);
  
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [wrong1, setWrong1] = useState('');
  const [wrong2, setWrong2] = useState('');
  const [wrong3, setWrong3] = useState('');

  const fetchConfig = async () => {
    const docRef = doc(db, 'quiz_config', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setConfig(docSnap.data());
    } else {
      await setDoc(docRef, { isOpen: false, questionsPerUser: 5 });
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const pSnap = await getDocs(collection(db, 'quiz_participants'));
      const list = [];
      pSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.score - a.score);
      setParticipants(list);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // دالة جديدة لجلب الأسئلة الحالية من قاعدة البيانات
  const fetchQuestions = async () => {
    try {
      const qSnap = await getDocs(collection(db, 'quiz_questions'));
      const list = [];
      qSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setQuestionsList(list);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig();
      fetchParticipants();
      fetchQuestions();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin2026') { 
      setIsAuthenticated(true);
    } else {
      alert('كلمة المرور خاطئة!');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !correctAnswer.trim() || !wrong1.trim() || !wrong2.trim() || !wrong3.trim()) {
      return alert('يرجى تعبئة جميع الحقول بشكل صحيح');
    }
    try {
      const newQuestion = {
        text: questionText.trim(),
        correct: correctAnswer.trim(),
        wrongs: [wrong1.trim(), wrong2.trim(), wrong3.trim()],
        createdAt: new Date()
      };
      const qRef = doc(collection(db, 'quiz_questions'));
      await setDoc(qRef, newQuestion);
      alert('تم إضافة السؤال بنجاح!');
      setQuestionText(''); setCorrectAnswer(''); setWrong1(''); setWrong2(''); setWrong3('');
      fetchQuestions(); // إعادة تحديث القائمة فوراً
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  // دالة جديدة لحذف سؤال واحد محدد
  const handleDeleteSingleQuestion = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السؤال فقط؟")) return;
    try {
      await deleteDoc(doc(db, 'quiz_questions', id));
      alert('تم حذف السؤال!');
      fetchQuestions();
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء الحذف');
    }
  };

  const toggleStatus = async () => {
    const newStatus = !config.isOpen;
    await updateDoc(doc(db, 'quiz_config', 'main'), { isOpen: newStatus });
    setConfig({ ...config, isOpen: newStatus });
  };

  const updateQuestionsCount = async (num) => {
    await updateDoc(doc(db, 'quiz_config', 'main'), { questionsPerUser: Number(num) });
    setConfig({ ...config, questionsPerUser: Number(num) });
    alert('تم تحديث عدد الأسئلة بنجاح!');
  };

  const wipeAllData = async () => {
    const confirmDelete = window.confirm("⚠️ هل أنت متأكد تماماً؟ سيتم حذف جميع الأسئلة ونتائج المشاركين نهائياً!");
    if (!confirmDelete) return;

    try {
      const batch = writeBatch(db);
      const pSnap = await getDocs(collection(db, 'quiz_participants'));
      pSnap.forEach((d) => batch.delete(d.ref));
      
      const qSnap = await getDocs(collection(db, 'quiz_questions'));
      qSnap.forEach((d) => batch.delete(d.ref));

      await batch.commit();
      alert('تم تفريغ المسابقة بنجاح!');
      setParticipants([]);
      setQuestionsList([]);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حذف البيانات');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-right" dir="rtl">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col gap-4 w-full max-w-md border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-2">🔐 لوحة الإدارة السرية</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" className="p-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500 text-center" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold transition-all">دخول</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 border-b border-gray-800 pb-4">إدارة المسابقات والنتائج</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-green-400">⚙️ إعدادات المسابقة</h2>
          <div className="flex flex-col gap-4">
            <button onClick={toggleStatus} className={`p-3 rounded-xl font-bold text-lg transition-all ${config.isOpen ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
              {config.isOpen ? '🔴 إغلاق استقبال المشاركات' : '🟢 فتح استقبال المشاركات'}
            </button>
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm text-gray-400">عدد الأسئلة لكل متسابق:</label>
              <div className="flex gap-2">
                <input type="number" value={config.questionsPerUser} onChange={(e) => setConfig({...config, questionsPerUser: e.target.value})} className="p-3 bg-gray-700 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                <button onClick={() => updateQuestionsCount(config.questionsPerUser)} className="bg-blue-600 hover:bg-blue-500 px-5 rounded-xl font-bold transition-all">تحديث</button>
              </div>
            </div>
            <button onClick={wipeAllData} className="mt-6 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white p-3 rounded-xl font-bold transition-all">
              ⚠️ تصفير المسابقة (حذف كل شيء)
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-blue-400">➕ إضافة سؤال جديد لبنك الأسئلة</h2>
          <form onSubmit={handleAddQuestion} className="flex flex-col gap-3">
            <input type="text" placeholder="نص السؤال..." value={questionText} onChange={(e)=>setQuestionText(e.target.value)} className="p-3 bg-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg" required />
            <input type="text" placeholder="✔️ الإجابة الصحيحة" value={correctAnswer} onChange={(e)=>setCorrectAnswer(e.target.value)} className="p-3 bg-gray-700 border border-green-500/50 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="❌ خيار خاطئ 1" value={wrong1} onChange={(e)=>setWrong1(e.target.value)} className="p-3 bg-gray-700 rounded-xl outline-none" required />
              <input type="text" placeholder="❌ خيار خاطئ 2" value={wrong2} onChange={(e)=>setWrong2(e.target.value)} className="p-3 bg-gray-700 rounded-xl outline-none" required />
              <input type="text" placeholder="❌ خيار خاطئ 3" value={wrong3} onChange={(e)=>setWrong3(e.target.value)} className="p-3 bg-gray-700 rounded-xl outline-none" required />
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-500 p-3 rounded-xl font-bold mt-3 transition-all text-lg">حفظ السؤال في القاعدة</button>
          </form>
        </div>
      </div>

      {/* قسم مستعرض بنك الأسئلة المضافة حديثاً */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8">
        <h2 className="text-xl font-bold text-sky-400 mb-4">🗂️ بنك الأسئلة الحالي ({questionsList.length} سؤال)</h2>
        {questionsList.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">بنك الأسئلة فارغ حالياً.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {questionsList.map((q, idx) => (
              <div key={q.id} className="bg-gray-900 p-3 rounded-xl flex justify-between items-center border border-gray-700/50">
                <div>
                  <p className="font-semibold text-sm text-gray-200">{idx + 1}. {q.text}</p>
                  <p className="text-xs text-green-400 mt-1">✔️ {q.correct}</p>
                </div>
                <button onClick={() => handleDeleteSingleQuestion(q.id)} className="bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all">حذف</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">🏆 لوحة صدارة المشاركين ({participants.length})</h2>
          <button onClick={fetchParticipants} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-all">🔄 تحديث القائمة</button>
        </div>
        
        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري تحميل نتائج المتسابقين...</p>
        ) : participants.length === 0 ? (
          <p className="text-center text-gray-500 py-8">لا يوجد مشاركون حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 bg-gray-900/50">
                  <th className="p-3">الترتيب</th>
                  <th className="p-3">الاسم الثلاثي</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">النقاط</th>
                  <th className="p-3">التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => (
                  <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
                    <td className="p-3 font-bold text-blue-400">#{idx + 1}</td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3 text-gray-300" dir="ltr">{p.phone}</td>
                    <td className="p-3"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold">{p.score}</span></td>
                    <td className="p-3 text-xs text-gray-400">{p.timestamp?.toDate ? new Date(p.timestamp.toDate()).toLocaleString('ar-EG') : 'غير متوفر'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuiz;