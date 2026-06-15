import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Quran from './pages/Quran';
import Hadith from './pages/Hadith';
import Quiz from './pages/Quiz';
import AdminQuiz from './pages/AdminQuiz';
import Library from './pages/Library'; // تم إضافة المكتبة

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quran" element={<Quran />} />
        <Route path="/hadith" element={<Hadith />} />
        <Route path="/quiz" element={<Quiz />} /> 
        <Route path="/secret-admin-quiz" element={<AdminQuiz />} /> 
        <Route path="/library" element={<Library />} /> {/* مسار المكتبة */}
      </Routes>
    </Router>
  );
}

export default App;