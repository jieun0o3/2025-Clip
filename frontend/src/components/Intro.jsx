import React from 'react';
import { useNavigate } from 'react-router-dom';

function Intro() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/onboarding'); 
  };

  return (
    <div className="intro-container"> 
        <div className="intro-content">
          <div className="intro-header">
            <span className="intro-logo-text">Clip</span>
          </div> 
          
          <h2 className="intro-title">나만의 맞춤형 스크랩북</h2>
          
          <p className="intro-description">관심 있는 정보를 카테고리에 모아 쉽게 관리하고 찾아보세요.</p>
          
          <button className="complete-button intro-start-button" onClick={handleStart}>
            시작하기
          </button>
        </div>
    </div>
  );
}

export default Intro;