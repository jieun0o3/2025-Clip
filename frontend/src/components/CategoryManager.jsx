import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { addCategory, moveScrapsAndDeleteCategory } from '../services/firestore'; // 함수 임포트 변경
import { FiX, FiPlus } from 'react-icons/fi';

const DEFAULT_CATEGORIES = ['대외활동', '장학금', '여행', '알바', '주식', '채용공고'];

function CategoryManager({ user, currentCategories, onClose, onUpdate }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // --- 삭제 UI를 위한 상태 추가 ---
  const [deletingCategoryId, setDeletingCategoryId] = useState(null); // 현재 삭제하려는 카테고리의 ID
  const [moveTargetCategoryId, setMoveTargetCategoryId] = useState(''); // 스크랩을 이동시킬 목표 카테고리 ID
  const [isProcessing, setIsProcessing] = useState(false); // 처리 중 상태 (버튼 비활성화용)
  
  const myCategoryNames = currentCategories.map(c => c.name);
  const availableDefaultCategories = DEFAULT_CATEGORIES.filter(
    name => !myCategoryNames.includes(name)
  );

  const handleAddCategory = async (name) => {
    if (!name.trim() || isProcessing) return;
    setIsProcessing(true);
    await addCategory(user.uid, name.trim());
    setNewCategoryName('');
    onUpdate(); // 부모 컴포넌트에 변경사항 알림
    setIsProcessing(false);
  };
  
  // 'X' 버튼 클릭 시 삭제 프로세스 시작
  const startDeletionProcess = (categoryId) => {
    // 이동할 다른 카테고리가 없는 경우
    if (currentCategories.length <= 1) {
      alert("삭제할 수 없습니다. 스크랩을 옮길 다른 카테고리가 존재해야 합니다.");
      return;
    }
    setDeletingCategoryId(categoryId);
  };

  // '취소' 버튼 클릭 시 삭제 프로세스 종료
  const cancelDeletion = () => {
    setDeletingCategoryId(null);
    setMoveTargetCategoryId('');
  };
  
  // '이동 및 삭제' 버튼 클릭 시 최종 실행
  const handleConfirmDeletion = async () => {
    if (!moveTargetCategoryId || isProcessing) return;

    setIsProcessing(true);
    try {
      await moveScrapsAndDeleteCategory(user.uid, deletingCategoryId, moveTargetCategoryId);
      onUpdate(); // 목록 새로고침
      cancelDeletion(); // 상태 초기화
    } catch (error) {
      console.error("카테고리 삭제 및 이동 중 오류 발생:", error);
      alert("작업에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <h2>카테고리 관리</h2>

        <div className="category-box">
          <h3>나의 카테고리</h3>
          <div className="category-list-vertical"> {/* 세로 정렬을 위해 클래스명 변경 */}
            {currentCategories.map(cat => (
              <div key={cat.id} className="category-item-wrapper-manage">
                {/* 1. 현재 카테고리가 삭제 대상인지 확인 */}
                {deletingCategoryId === cat.id ? (
                  // 2. 삭제 대상이면 '삭제 UI'를 렌더링
                  <div className="delete-confirm-ui">
                    <span className="delete-confirm-label">"{cat.name}"의 스크랩을 어디로 옮길까요?</span>
                    <select
                      value={moveTargetCategoryId}
                      onChange={(e) => setMoveTargetCategoryId(e.target.value)}
                      className="category-select"
                    >
                      <option value="" disabled>-- 선택 --</option>
                      {currentCategories
                        .filter(c => c.id !== deletingCategoryId) // 자기 자신을 제외한 카테고리 목록
                        .map(targetCat => (
                          <option key={targetCat.id} value={targetCat.id}>
                            {targetCat.name}
                          </option>
                        ))}
                    </select>
                    <div className="delete-confirm-buttons">
                      <button 
                        onClick={handleConfirmDeletion}
                        disabled={!moveTargetCategoryId || isProcessing}
                        className="confirm-btn"
                      >
                        {isProcessing ? '처리중...' : '이동 및 삭제'}
                      </button>
                      <button onClick={cancelDeletion} disabled={isProcessing} className="cancel-btn">취소</button>
                    </div>
                  </div>
                ) : (
                  // 3. 삭제 대상이 아니면 '기본 UI'를 렌더링
                  <>
                    <span>{cat.name}</span>
                    <button onClick={() => startDeletionProcess(cat.id)} className="delete-category-btn" disabled={isProcessing}>
                      <FiX />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ... (추천 카테고리 및 새 카테고리 추가 부분은 이전과 동일) ... */}
        <div className="category-box">
          <h3>추천 카테고리 추가</h3>
          <div className="category-list">
            {availableDefaultCategories.map(name => (
              <button key={name} onClick={() => handleAddCategory(name)} className="add-category-chip" disabled={isProcessing}>
                <FiPlus /> {name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(newCategoryName); }} className="add-category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 카테고리 이름"
            disabled={isProcessing}
          />
          <button type="submit" disabled={isProcessing || !newCategoryName.trim()}>추가</button>
        </form>

        <button onClick={onClose} className="close-modal-btn">닫기</button>
      </motion.div>
    </motion.div>
  );
}

export default CategoryManager;