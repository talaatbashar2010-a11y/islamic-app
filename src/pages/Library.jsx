import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Library = () => {
  const [books] = useState([
    { id: 1, title: 'الرحيق المختوم', author: 'صفي الرحمن المباركفوري', category: 'السيرة النبوية', fileUrl: '#' },
    { id: 2, title: 'تفسير ابن كثير', author: 'ابن كثير', category: 'التفسير', fileUrl: '#' },
    { id: 3, title: 'الأربعون النووية', author: 'الإمام النووي', category: 'الحديث', fileUrl: '#' },
  ]);

  const handleDownload = (title) => {
    // يمكنك لاحقاً تبديل هذا بفتح رابط حقيقي للـ PDF من Firebase Storage
    alert(`📥 جاري تحضير ملف PDF لكتاب "${title}" للتحميل المباشر...`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <Link to="/" className="bg-gray-800 text-gray-300 hover:text-white px-5 py-2 rounded-xl border border-gray-700 hover:border-gray-500 transition-all font-bold">
          ⬅ عودة للرئيسية
        </Link>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-arabic">
          المكتبة الإسلامية الرقمية 📚
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col justify-between hover:border-purple-500/50 transition-all">
            <div>
              <span className="text-xs bg-gray-900 text-purple-400 px-3 py-1 rounded-full font-bold border border-gray-700">
                {book.category}
              </span>
              <h2 className="text-xl font-bold mt-4 text-gray-100">{book.title}</h2>
              <p className="text-sm text-gray-400 mt-2">✍️ {book.author}</p>
            </div>
            <button 
              onClick={() => handleDownload(book.title)} 
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold transition-all w-full shadow-md active:scale-95"
            >
              تحميل وقراءة (PDF)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;