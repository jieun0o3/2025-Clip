import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { addInitialCategories, completeOnboarding } from '../services/firestore';
import { FiPlus } from 'react-icons/fi';

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
  const { user } = useAuthState();
  const navigate = useNavigate();
  
  const [myCategories, setMyCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);

  const addCategory = (category) => {
    if (myCategories.includes(category)) return;
    setMyCategories([...myCategories, category]);
    setAvailableCategories(availableCategories.filter(c => c !== category));
  };

  const deselectCategory = (category) => {
    setMyCategories(myCategories.filter(c => c !== category));
    if (DEFAULT_CATEGORIES.includes(category) && !availableCategories.includes(category)) {
      setAvailableCategories([...availableCategories, category]);
    }
  };

  const addCustomCategory = (categoryText) => {
    if (categoryText.trim() && categoryText !== '...' && !myCategories.includes(categoryText.trim())) {
      setMyCategories([...myCategories, categoryText.trim()]);
    }
  };

  const handleComplete = async () => {
    if (!user || myCategories.length === 0) return;
    await addInitialCategories(user.uid, myCategories);
    await completeOnboarding(user.uid);
    navigate('/scrapbook');
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

        <button className="complete-button" onClick={handleComplete} disabled={myCategories.length === 0}>
          완료하고 시작하기
        </button>
      </div>
    </div>
  );
}

export default Onboarding;