// src/hooks/useAuthState.js

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // onSnapshot import
import { auth, db } from '../firebase';
import { checkAndCreateUserProfile } from '../services/firestore';

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 처음 프로필을 한 번 가져옵니다.
        await checkAndCreateUserProfile(currentUser);
        setUser(currentUser);
        
        // 실시간으로 프로필 변경을 감지하는 리스너 설정
        const userDocRef = doc(db, 'users', currentUser.uid);
        const profileUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          }
          setLoading(false);
        });

        // auth 상태가 변경되면 profile 리스너도 함께 정리합니다.
        return () => profileUnsubscribe();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  return { user, userProfile, loading };
}