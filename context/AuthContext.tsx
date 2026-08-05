"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserDTO } from "@/lib/data/types";
import { getMe } from "@/lib/api/auth";



// Context 가 담을 데이터 타입 정의
// 전역으로 공유할 값이 추가되면 여기에 먼저 선언
type AuthContextType = {
  userSession: UserDTO | null;
  setUserSession: (userSession: UserDTO | null) => void;
  isLoading: boolean;
};



// Context 생성 (기능 저장소)
const AuthContext = createContext<AuthContextType | null>(null);

// 전체 앱을 감싸는 Provider 컴포넌트 layout.tsx 에 전체적으로 감싸져있음
// → layout.tsx 에서 <AuthProvider> 로 감싸야 동작함
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 로그인 시 setUserSession(data.user) 
  // 로그아웃 시 setUserSession(null)
  const [userSession, setUserSession] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인 (초기 마운트 + 탭 재포커스 시)
    // 세션이 서버에서 만료/삭제돼도 네브바가 계속 로그인 상태로 남아있던 문제 방지
    const check = () => {
      getMe()
        .then(user => setUserSession(user))
        .finally(() => setIsLoading(false));
    };

    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);


  return (
    <AuthContext.Provider value={{ userSession, setUserSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 사용법: const { userSession, setUserSession } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
