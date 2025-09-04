import React, { useState } from 'react';
import { addScrap } from '../services/firestore';

function AddScrapForm({ user, categoryId, onScrapAdded }) {
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    const scrapData = {
      type: 'link', // 우선 링크 타입만 구현
      data: { url, memo, title: url },
    };

    await addScrap(user.uid, categoryId, scrapData);
    setUrl('');
    setMemo('');
    onScrapAdded(); // 스크랩 추가 완료 신호 보내기
  };

  return (
    <form onSubmit={handleSubmit} className="add-scrap-form">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="새로운 링크 스크랩"
      />
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모"
      />
      <button type="submit">저장</button>
    </form>
  );
}
export default AddScrapForm;