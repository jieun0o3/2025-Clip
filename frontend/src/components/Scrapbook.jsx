import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiImage, FiType, FiLink, FiYoutube, FiUsers, FiX, FiFileText, FiMaximize2 } from 'react-icons/fi';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getUserCategories, deleteScrap } from '../services/firestore';
import { getTemporaryUserId } from '../services/session';
import { db } from '../firebase'; 

import AddScrapForm from './AddScrapForm';
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
  const [categories, setCategories] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const tempUserId = getTemporaryUserId();
  const [expandedImage, setExpandedImage] = useState(null);
  
  // 카테고리 불러오기
  const fetchCategories = useCallback(async () => {
    if (!tempUserId) { 
      setCategories([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const userCategories = await getUserCategories(tempUserId); 
      setCategories(userCategories);
      
      if (userCategories.length > 0 && !userCategories.find(c => c.id === selectedCategoryId)) {
        setSelectedCategoryId(userCategories[0].id);
      } else if (userCategories.length === 0) {
        setSelectedCategoryId(null);
        setScraps([]);
      }
    } catch (error) {
      console.error("카테고리를 불러오는 중 오류가 발생했습니다:", error);
    }
    setIsLoading(false);
  }, [tempUserId, selectedCategoryId]);

  useEffect(() => {
    fetchCategories(); 
  }, [fetchCategories]);

  // 스크랩 로딩 (실시간 리스너)
  useEffect(() => {
    if (!tempUserId || !selectedCategoryId) {
      setScraps([]);
      return;
    }
    
    setIsLoading(true);

    const q = query(
      collection(db, 'scraps'),
      where('userId', '==', tempUserId),
      where('categoryId', '==', selectedCategoryId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryScraps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScraps(categoryScraps);
      setIsLoading(false);
    }, (error) => {
      console.error("스크랩 실시간 로드 오류:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tempUserId, selectedCategoryId]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || categories.length === 0) return null; 
    return categories.find(cat => cat.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const groupedScraps = useMemo(() => {
    return scraps.reduce((acc, scrap) => {
      const type = scrap.type || 'default';
      if (!acc[type]) { acc[type] = []; }
      acc[type].push(scrap);
      return acc;
    }, {});
  }, [scraps]);

  const handleDeleteScrap = async (scrapId) => {
    if (window.confirm('스크랩을 삭제하시겠습니까?')) {
      await deleteScrap(scrapId);
    }
  };

  return (
    <div className="scrapbook-container">
      <AnimatePresence>
        {expandedImage && (
          <motion.div 
            className="image-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedImage(null)}
          >
            <motion.img 
              src={expandedImage} 
              alt="Expanded" 
              className="lightbox-image"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 닫히지 않게
            />
            <button className="lightbox-close-btn" onClick={() => setExpandedImage(null)}>
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="main-content room-view">
        {/* 상단 카테고리 탭 */}
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
          <button className="manage-categories-btn" onClick={() => setIsCategoryModalOpen(true)}>
            카테고리 관리
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isCategoryModalOpen && (
            <CategoryManager
              userId={tempUserId}
              currentCategories={categories}
              onClose={() => setIsCategoryModalOpen(false)}
              onUpdate={fetchCategories} 
            />
          )}
        </AnimatePresence>
        

        {/* 스크랩 추가 폼 */}
        {selectedCategory && (
          <AddScrapForm
            userId={tempUserId}
            categoryId={selectedCategoryId}
          />
        )}

        {/* 목록 렌더링 */}
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
                  <h3>{type === 'link' ? 'Link' : type === 'image' ? 'Image' : 'Text'}</h3>
                  <span>{items.length}</span>
                </div>
                
                <div className={`room-item-scraps ${type}-layout`}>
                  <AnimatePresence>
                    {items.map(scrap => (
                      <motion.div 
                        key={scrap.id} 
                        className="scrap-card-enhanced"
                        initial={{ opacity: 0, scale: 0.8, y: 10 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }}    
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}   
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        layout
                      >
                      {/* --- 타입별 렌더링 분기 --- */}
                      
                      {/* 1. 링크 타입 */}
                      {type === 'link' && (
                        <>
                        <div className="card-left">
                          <img 
                            /* 플레이스토어 아이콘 방지를 위한 북마크 파비콘 API 주소 적용 */
                            src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${scrap.data.url}&sz=64`} 
                            alt="icon" 
                            className="card-favicon"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div className="card-main">
                          <div className="card-info">
                            <a href={scrap.data.url} target="_blank" rel="noopener noreferrer" className="card-url-link">
                              {scrap.data.memo || scrap.data.url} 
                            </a>
                            <p className="card-url-path">
                              {scrap.data.url ? new URL(scrap.data.url).hostname : '알 수 없는 링크'}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteScrap(scrap.id)} className="card-delete-btn-new">
                            <FiX />
                          </button>
                        </div>
                        </>
                        )}

                        {/* 2. 이미지 타입 */}
                      {type === 'image' && (
                        <div className="image-card-content">
                          <div 
                            className="image-thumbnail-wrapper" 
                            onClick={() => setExpandedImage(scrap.data.imageUrl)}
                          >
                            <img src={scrap.data.imageUrl} alt="scrap" className="image-thumbnail" />
                            <div className="hover-overlay"><FiMaximize2 /></div>
                          </div>
                          <div className="card-main">
                             <div className="card-info">
                                <span className="card-text-title">{scrap.data.title}</span>
                                <span className="card-date">{new Date(scrap.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                             </div>
                             <button onClick={() => handleDeleteScrap(scrap.id)} className="card-delete-btn-new">
                            <FiX />
                          </button>
                          </div>
                        </div>
                      )}

                      {/* 3. 텍스트 타입 */}
                      {type === 'text' && (
                        <>
                          <div className="card-left">
                            <FiFileText className="text-icon" />
                          </div>
                          <div className="card-main">
                             <div className="card-info">
                                <span className="card-text-content">{scrap.data.content}</span>
                                {scrap.data.memo && <span className="card-memo-sub">{scrap.data.memo}</span>}
                             </div>
                             <button onClick={() => handleDeleteScrap(scrap.id)} className="card-delete-btn-new">
                            <FiX />
                          </button>
                          </div>
                        </>
                      )}

                      </motion.div>
                    ))}
                  </AnimatePresence>
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