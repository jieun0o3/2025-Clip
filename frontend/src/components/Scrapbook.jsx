import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { getUserCategories, getScrapsByCategory, deleteScrap } from '../services/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiImage, FiType, FiLink, FiYoutube, FiUsers } from 'react-icons/fi';
import AddScrapForm from './AddScrapForm';

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

  useEffect(() => {
    if (!user) return;
    const fetchCategories = async () => {
      const userCategories = await getUserCategories(user.uid);
      setCategories(userCategories);
      if (userCategories.length > 0) {
        setSelectedCategoryId(currentId => currentId || userCategories[0].id);
      }
      setIsLoading(false);
    };
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    setIsLoading(true);
    const fetchScraps = async () => {
      const categoryScraps = await getScrapsByCategory(selectedCategoryId);
      setScraps(categoryScraps);
      setIsLoading(false);
    };
    fetchScraps();
  }, [selectedCategoryId]);

  const groupedScraps = useMemo(() => {
    return scraps.reduce((acc, scrap) => {
      const type = scrap.type || 'default';
      if (!acc[type]) { acc[type] = []; }
      acc[type].push(scrap);
      return acc;
    }, {});
  }, [scraps]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const fetchScraps = async () => {
  if (!selectedCategoryId) return;
  setIsLoading(true);
  const categoryScraps = await getScrapsByCategory(selectedCategoryId);
  setScraps(categoryScraps);
  setIsLoading(false);
  };

  const handleDeleteScrap = async (scrapId) => {
  if (window.confirm('스크랩을 삭제하시겠습니까?')) {
    await deleteScrap(scrapId);
    fetchScraps(); // 목록 새로고침
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
        </div>
        <AnimatePresence mode="wait">
          <motion.h2 key={selectedCategory?.id || 'loading'} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            {selectedCategory ? selectedCategory.name : '카테고리를 선택하세요'}
          </motion.h2>
        </AnimatePresence>

        {/* --- 스크랩 추가 폼 --- */}
        {selectedCategory && (
          <AddScrapForm
            user={user}
            categoryId={selectedCategoryId}
            onScrapAdded={fetchScraps}
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