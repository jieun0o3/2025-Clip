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
          {/* 로고 자리 */}
          <div className="intro-logo">Clip</div> 
          
          <h2 className="intro-title">당신의 효율적인 스크랩 도우미</h2>
          
          <p className="intro-description">관심 있는 정보를 카테고리에 모아 쉽게 관리하고 찾아보세요.</p>
          
          {/* 완료 버튼과 동일한 스타일을 적용할 클래스 사용 */}
          <button className="complete-button intro-start-button" onClick={handleStart}>
            시작하기
          </button>
        </div>
    </div>
  );
}

export default Intro;