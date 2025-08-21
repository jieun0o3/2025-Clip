import React from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import Onboarding from './components/Onboarding';
import Scrapbook from './components/Scrapbook';
import Login from './components/Login';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { FiLogOut } from 'react-icons/fi';

// 로그인/온보딩 상태에 따라 페이지 접근 제어
function ProtectedRoute({ children }) {
  const { user, userProfile, loading } = useAuthState();

  if (loading) {
    return <div className="loading-screen">로딩 중...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!userProfile?.hasCompletedOnboarding) {
    // 온보딩 미완료 시 /onboarding 으로 강제 이동
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function App() {
  const { user, loading } = useAuthState();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <img src="/clip-icon.svg" alt="Clip Icon" />
          <h1>Clip</h1>
        </div>
        {user && (
          <button onClick={handleLogout} className="logout-button">
            <FiLogOut /> 로그아웃
          </button>
        )}
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/scrapbook" />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route 
            path="/scrapbook" 
            element={<ProtectedRoute><Scrapbook /></ProtectedRoute>} 
          />
          <Route path="*" element={<Navigate to={user ? "/scrapbook" : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;