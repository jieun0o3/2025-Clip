import React, { useState, useRef } from 'react';
import { addScrap } from '../services/firestore';
import { FiLink, FiImage, FiFileText, FiX } from 'react-icons/fi';

function AddScrapForm({ userId, categoryId }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link', 'image', 'text'
  const [loading, setLoading] = useState(false);

  // 입력 상태 관리
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState(''); // 공통 타이틀/메모
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // 파일 선택 핸들러 (이미지 미리보기)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일인지 확인
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFile(file);
          setPreviewUrl(reader.result); // Base64 문자열
        };
        reader.readAsDataURL(file);
      } else {
        alert('이미지 파일만 업로드 가능합니다.');
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let scrapData = null;

    try {
      setLoading(true);

      // 1. 링크 타입
      if (activeTab === 'link') {
        if (!url.trim()) return;
        scrapData = {
          type: 'link',
          data: { url, memo: title, title: title || url }
        };
      } 
      // 2. 이미지 타입 (Base64 저장)
      else if (activeTab === 'image') {
        if (!previewUrl) return;
        scrapData = {
          type: 'image',
          data: { 
            imageUrl: previewUrl, // Base64 문자열
            fileName: selectedFile.name,
            memo: title,
            title: title || selectedFile.name 
          }
        };
      }
      // 3. 텍스트 타입
      else if (activeTab === 'text') {
        if (!textContent.trim()) return;
        scrapData = {
          type: 'text',
          data: { 
            content: textContent, 
            memo: title,
            title: title || textContent.slice(0, 20) + '...' 
          }
        };
      }

      if (scrapData) {
        await addScrap(userId, categoryId, scrapData);
        
        // 입력창 초기화
        setUrl('');
        setTitle('');
        setTextContent('');
        clearFile();
      }
    } catch (error) {
      console.error("스크랩 추가 실패:", error);
      alert("저장에 실패했습니다. 이미지 크기가 너무 클 수 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-scrap-container">
      {/* 상단 탭 메뉴 */}
      <div className="scrap-type-tabs">
        <button 
          type="button" 
          className={`type-tab ${activeTab === 'link' ? 'active' : ''}`}
          onClick={() => setActiveTab('link')}
        >
          <FiLink /> 링크
        </button>
        <button 
          type="button" 
          className={`type-tab ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <FiImage /> 이미지
        </button>
        <button 
          type="button" 
          className={`type-tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FiFileText /> 텍스트
        </button>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="add-scrap-form">
        
        {/* 공통: 타이틀/메모 입력 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="타이틀 / 메모"
          className="common-input"
        />

        {/* 탭별 내용 입력 */}
        <div className="input-area">
          {activeTab === 'link' && (
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="url-input"
              autoFocus
            />
          )}

          {activeTab === 'image' && (
            <div className="file-upload-wrapper">
              {!previewUrl ? (
                <div className="upload-box" onClick={() => fileInputRef.current.click()}>
                  <span>클릭하여 이미지 업로드</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    hidden 
                  />
                </div>
              ) : (
                <div className="preview-box">
                  <img src={previewUrl} alt="Preview" />
                  <button type="button" className="remove-file-btn" onClick={clearFile}>
                    <FiX />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              rows={3}
              className="text-area"
            />
          )}
        </div>

        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}

export default AddScrapForm;