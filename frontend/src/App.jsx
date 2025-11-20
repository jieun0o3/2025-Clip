import React, { useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Intro from './components/Intro';
import Onboarding from './components/Onboarding';
import Scrapbook from './components/Scrapbook';

function App() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <img src="/Clip_logo_ver1.jpg" alt="Clip Icon" />
          <h1>Clip</h1>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scrapbook" element={<Scrapbook />} />
          <Route path="*" element={<Navigate to="/" replace />} />   
        </Routes>
      </main>
    </div>
  );
}

export default App;