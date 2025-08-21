import React, { useState, useEffect } from 'react';
import './App.css';
// firebase.js 파일에서 Firestore DB 접속 정보를 가져옴
import { db } from './firebase';
// Firestore와 통신하기 위한 함수들
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

function App() {
  // React의 State(상태)를 사용해 데이터 관리
  // inputUrl: 사용자가 입력창에 넣는 URL 값을 저장하는 상태
  // scraps: Firestore에서 불러온 스크랩 목록을 저장하는 상태
  const [inputUrl, setInputUrl] = useState('');
  const [scraps, setScraps] = useState([]);

  // 'scraps'라는 이름의 컬렉션(데이터 묶음)을 참조
  const scrapsCollectionRef = collection(db, 'scraps');

  // 스크랩 추가 함수
  const addScrap = async () => {
    // 입력창이 비어있으면 함수를 종료
    if (inputUrl === '') return;

    // Firestore 'scraps' 컬렉션에 새 문서를 추가
    await addDoc(scrapsCollectionRef, {
      url: inputUrl,
      createdAt: serverTimestamp() // 현재 시간을 기록
    });

    // 추가 후 입력창을 비움
    setInputUrl('');
    // 목록을 새로고침 (추후 실시간 업데이트로 개선)
    fetchScraps();
  };

  // Firestore에서 스크랩 목록을 가져오는 함수
  const fetchScraps = async () => {
    const data = await getDocs(scrapsCollectionRef);
    const fetchedScraps = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    setScraps(fetchedScraps);
  };

  // useEffect: 컴포넌트가 처음 화면에 렌더링될 때 실행할 작업을 지정
  // 여기서는 처음 접속 시 스크랩 목록을 불러오는 역할
  useEffect(() => {
    fetchScraps();
  }, []);


  // UI
  return (
    <div className="App">
      <header className="App-header">
        <h1>Clip 📎</h1>
        [cite_start]<p>당신의 효율적인 스크랩을 도와드립니다. [cite: 2]</p>
        <div className="scrap-input-container">
          <input
            type="text"
            placeholder="스크랩할 링크를 붙여넣으세요..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          <button onClick={addScrap}>추가</button>
        </div>
        <div className="scrap-list">
          <h2>스크랩 목록</h2>
          <ul>
            {scraps.map(scrap => (
              <li key={scrap.id}>
                <a href={scrap.url} target="_blank" rel="noopener noreferrer">
                  {scrap.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;