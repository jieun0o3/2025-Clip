import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { getUserCategories, getScrapsByCategory, deleteScrap } from '../services/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiImage, FiType, FiLink, FiYoutube, FiUsers } from 'react-icons/fi';
import AddScrapForm from './AddScrapForm';
import { FiPlusCircle } from 'react-icons/fi';
import CategoryManager from './CategoryManager';

const scrapTypeIcons = {
  link: <FiLink />,
  image: <FiImage />,
  text: <FiType />,
  video: <FiYoutube />,
  sns: <FiUsers />,
  default: <FiBook />,
};

function Scrapbook() {
  const { user } = useAuthState();
  const [categories, setCategories] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  
// 1. fetchCategories 함수를 useCallback을 이용해 컴포넌트 최상단에 정의합니다.
const fetchCategories = useCallback(async () => {
  if (!user) {
    // 로그아웃 상태일 경우 카테고리 목록을 비웁니다.
    setCategories([]);
    return;
  }
  
  try {
    const userCategories = await getUserCategories(user.uid);
    setCategories(userCategories);
    
    // 카테고리 삭제 또는 변경 후 선택된 ID가 유효하지 않을 때, 첫 번째 카테고리를 기본값으로 선택
    if (userCategories.length > 0 && !userCategories.find(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(userCategories[0].id);
    } else if (userCategories.length === 0) {
      // 카테고리가 하나도 없을 경우
      setSelectedCategoryId(null);
      setScraps([]);
    }
  } catch (error) {
      console.error("카테고리를 불러오는 중 오류가 발생했습니다:", error);
  }
}, [user, selectedCategoryId]);

// 2. useEffect를 사용해 함수를 실행합니다.
useEffect(() => {
  // 사용자 정보나 선택된 카테고리가 없으면 실행하지 않음
  if (!user || !selectedCategoryId) {
    setScraps([]);
    return;
  }

  const fetchScraps = async () => {
    setIsLoading(true);
    try {
      // user.uid를 getScrapsByCategory 함수에 전달
      const categoryScraps = await getScrapsByCategory(user.uid, selectedCategoryId);
      setScraps(categoryScraps);
    } catch (error) {
      console.error("스크랩을 불러오는 중 오류가 발생했습니다:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchScraps();
}, [user, selectedCategoryId]);

  const groupedScraps = useMemo(() => {
    return scraps.reduce((acc, scrap) => {
      const type = scrap.type || 'default';
      if (!acc[type]) { acc[type] = []; }
      acc[type].push(scrap);
      return acc;
    }, {});
  }, [scraps]);;

  // 목록 새로고침 함수
const refreshScraps = () => {
    const currentId = selectedCategoryId;
    setSelectedCategoryId(null); 
    setTimeout(() => setSelectedCategoryId(currentId), 0);
}

const handleDeleteScrap = async (scrapId) => {
  if (window.confirm('스크랩을 삭제하시겠습니까?')) {
    await deleteScrap(scrapId);
    refreshScraps(); // 목록 새로고침 함수 호출
  }
};

  return (
    <div className="scrapbook-container">
      <section className="main-content room-view">
        {/* --- 상단 카테고리 탭 --- */}
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          <button className="category-manage-btn" onClick={() => setIsCategoryModalOpen(true)}>
            <FiPlusCircle /> 카테고리 관리
          </button>
        </div>
        <AnimatePresence mode="wait">
          {isCategoryModalOpen && (
            <CategoryManager
              user={user}
              currentCategories={categories}
              onClose={() => setIsCategoryModalOpen(false)}
              onUpdate={fetchCategories} // 카테고리 변경 후 목록 새로고침
            />
          )}
        </AnimatePresence>

        {/* --- 스크랩 추가 폼 --- */}
        {selectedCategory && (
          <AddScrapForm
            user={user}
            categoryId={selectedCategoryId}
            onScrapAdded={refreshScraps}
          />
        )}

        {/* --- 스크랩이 없을 때 안내 메시지 추가 --- */}
        {isLoading ? (
          <p>스크랩을 불러오는 중...</p>
        ) : scraps.length === 0 ? (
          <div className="empty-state">
            <p>첫 스크랩을 추가해보세요!</p>
          </div>
        ) : (
          <div className="room-layout">
            {Object.entries(groupedScraps).map(([type, items], index) => (
              <motion.div 
                key={type} 
                className="room-item-container"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="room-item-header">
                  {scrapTypeIcons[type] || scrapTypeIcons.default}
                  <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                  <span>{items.length}</span>
                </div>
                <div className="room-item-scraps">
                  {/* --- 스크랩 목록 렌더링 --- */}
                  {items.map(scrap => (
                    <motion.div key={scrap.id} className="scrap-item-card">
                      <div className="scrap-content">
                        {scrap.data.memo && <p>{scrap.data.memo}</p>}
                        <a href={scrap.data.url} target="_blank" rel="noopener noreferrer">
                          {scrap.data.title}
                        </a>
                      </div>
                      <button onClick={() => handleDeleteScrap(scrap.id)} className="delete-btn">×</button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
export default Scrapbook;