import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, setDoc, serverTimestamp, doc } from 'firebase/firestore';
import { FiPlus } from 'react-icons/fi';
import { getTemporaryUserId } from "../services/session";
import { db } from '../firebase';
const DEFAULT_CATEGORIES = ['대외활동', '장학금', '여행', '알바', '주식', '채용공고'];

const CustomCategoryInput = ({ onAdd }) => {
  const [text, setText] = useState('...');
  const handleAdd = () => {
    onAdd(text);
    setText('...');
  };
  return (
    <div className="category-item-wrapper custom-add">
      <button className="plus-btn" onClick={handleAdd}>
        <FiPlus />
      </button>
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.value === '...' && setText('')}
        onBlur={(e) => e.target.value === '' && setText('...')}
      />
    </div>
  );
};

function Onboarding() {
  const navigate = useNavigate();
  
  const [myCategories, setMyCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);

  const addCategory = (category) => {
    if (myCategories.includes(category)) return;
    setMyCategories(prev => [...prev, category]);
    setAvailableCategories(prev => prev.filter(c => c !== category));
  };

  const deselectCategory = (category) => {
    setMyCategories(prev => prev.filter(c => c !== category));
    if (DEFAULT_CATEGORIES.includes(category) && !availableCategories.includes(category)) {
      setAvailableCategories(prev => [...prev, category]);
    }
  };

  const addCustomCategory = (categoryText) => {
    const trimmedText = categoryText.trim();
    if (trimmedText && trimmedText !== '...' && !myCategories.includes(trimmedText)) {
      setMyCategories(prev => [...prev, trimmedText]);
    }
  };

const handleStartClick = async () => {
const tempUserId = getTemporaryUserId(); 

  try {
    // db 객체와 collection, doc, setDoc 함수 사용
    const sessionDocRef = doc(db, 'sessions', tempUserId);
    
    await setDoc(sessionDocRef, {
      userId: tempUserId, 
      categories: myCategories,
      timestamp: serverTimestamp(),
    });
    navigate('/scrapbook'); 

  } catch (error) {
      console.error('카테고리 저장 오류:', error);
      alert('카테고리 저장에 실패했습니다. Firebase 보안 규칙을 확인하거나 관리자에게 문의하세요.');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <h2>환영합니다! 앞으로 스크랩을 정리할 카테고리를 설정해주세요.</h2>
        
        <div className="category-box my-categories">
          <h3>나의 카테고리 (클릭하여 삭제)</h3>
          <div className="category-list">
            {myCategories.map(cat => (
              <div key={cat} className="category-item-wrapper selected" onClick={() => deselectCategory(cat)}>
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="category-box available-categories">
          <h3>추천 카테고리</h3>
          <div className="category-list">
            {availableCategories.map(cat => (
              <div key={cat} className="category-item-wrapper">
                <button className="plus-btn" onClick={() => addCategory(cat)}>
                  <FiPlus />
                </button>
                <span>{cat}</span>
              </div>
            ))}
            <CustomCategoryInput onAdd={addCustomCategory} />
          </div>
        </div>

<button className="complete-button" onClick={handleStartClick} disabled={myCategories.length === 0}>
          완료
        </button>
      </div>
    </div>
  );
}

export default Onboarding;