import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addCategory, moveScrapsAndDeleteCategory } from '../services/firestore';
import { FiX, FiPlus } from 'react-icons/fi';

const DEFAULT_CATEGORIES = ['대외활동', '장학금', '여행', '알바', '주식', '채용공고'];

function CategoryManager({ userId, currentCategories, onClose, onUpdate }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [moveTargetCategoryId, setMoveTargetCategoryId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const myCategoryNames = currentCategories.map(c => c.name);
  const availableDefaultCategories = DEFAULT_CATEGORIES.filter(
    name => !myCategoryNames.includes(name)
  );

  const handleAddCategory = async (name) => {
    if (!name.trim() || isProcessing) return;
    setIsProcessing(true);
    await addCategory(userId, name.trim());
    setNewCategoryName('');
    onUpdate();
    setIsProcessing(false);
  };

  const startDeletionProcess = (categoryId) => {
    if (currentCategories.length <= 1) {
      alert("삭제할 수 없습니다. 스크랩을 옮길 다른 카테고리가 존재해야 합니다.");
      return;
    }
    setDeletingCategoryId(categoryId);
  };

  const cancelDeletion = () => {
    setDeletingCategoryId(null);
    setMoveTargetCategoryId('');
  };

  const handleConfirmDeletion = async () => {
    if (!moveTargetCategoryId || isProcessing) return;
    setIsProcessing(true);
    try {
      await moveScrapsAndDeleteCategory(userId, deletingCategoryId, moveTargetCategoryId);
      onUpdate();
      cancelDeletion();
    } catch (error) {
      console.error("카테고리 삭제 및 이동 중 오류 발생:", error);
      alert("작업에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-content-manage" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h2 className="modal-title">카테고리 설정</h2>

        {/* 나의 카테고리 영역 */}
        <div className="manage-section">
          <label className="section-label">나의 카테고리</label>
          <div className="manage-chip-group">
            {currentCategories.map(cat => (
              <div key={cat.id} className={`manage-chip ${deletingCategoryId === cat.id ? 'active-delete' : 'selected'}`}>
                {deletingCategoryId === cat.id ? (
                  <div className="delete-flow">
                    <span className="flow-text">이동 위치:</span>
                    <select
                      value={moveTargetCategoryId}
                      onChange={(e) => setMoveTargetCategoryId(e.target.value)}
                      className="flow-select"
                    >
                      <option value="" disabled>선택</option>
                      {currentCategories.filter(c => c.id !== deletingCategoryId).map(target => (
                        <option key={target.id} value={target.id}>{target.name}</option>
                      ))}
                    </select>
                    <button onClick={handleConfirmDeletion} className="flow-confirm">확인</button>
                    <button onClick={cancelDeletion} className="flow-cancel"><FiX /></button>
                  </div>
                ) : (
                  <>
                    <span>{cat.name}</span>
                    <button onClick={() => startDeletionProcess(cat.id)} className="chip-delete-btn">
                      <FiX />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 추천 카테고리 영역 */}
        <div className="manage-section">
          <label className="section-label">추천 추가</label>
          <div className="manage-chip-group">
            {availableDefaultCategories.map(name => (
              <button key={name} onClick={() => handleAddCategory(name)} className="manage-chip available">
                <FiPlus /> {name}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 영역 */}
        <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(newCategoryName); }} className="manage-input-group">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="직접 입력"
          />
          <button type="submit" disabled={!newCategoryName.trim()}>추가</button>
        </form>

        <button onClick={onClose} className="manage-close-btn">닫기</button>
      </motion.div>
    </motion.div>
  );
}

export default CategoryManager;