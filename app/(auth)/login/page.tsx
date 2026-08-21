"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/api/auth";   //auth api
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

// 백엔드 OAuthController가 실패 시 /login?oauthError={code} 로 리다이렉트하며 넘기는 코드 → 한글 메시지
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  A003: "이미 해당 이메일로 가입된 계정이 있습니다. 아이디/비밀번호로 로그인해 주세요.",
  A005: "소셜 로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
  A006: "잘못된 요청입니다. 다시 시도해 주세요.",
  CANCELLED: "로그인이 취소되었습니다.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  //세션 저장
  const { setUserSession } = useAuth();

  // 입력값 상태
  // 만약 회원가입 성공 시 userId 자동 입력
  const [userId, setUserId] = useState("");


  useEffect(() => {
    const prefill = sessionStorage.getItem("prefillUserId");
    if (prefill) setUserId(prefill);
  }, []);

  const [pwd, setPwd] = useState("");

  // UI 상태
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 소셜 로그인 콜백이 실패해서 돌아온 경우(oauthError 쿼리파라미터) 에러 메시지 표시
  useEffect(() => {
    const oauthError = searchParams.get("oauthError");
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] ?? "소셜 로그인에 실패했습니다.");
    }
  }, [searchParams]);



  // userID, pwd 빈값 체크
  // 빈값이 존재시 error 변수에 에러메세지 저장
  const handleLogin = async () => {
    if (!userId || !pwd) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    //문제 없을시 로딩 true
    setLoading(true);
    setError("");

    try {
      const data = await login(userId, pwd);
      if (!data.success) {
        setError(data.message ?? "로그인에 실패했습니다.");
        return;
      }
      setUserSession(data.user ?? null);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }

  }



  return (
    <div className="authWrap">
      <div className="authBox">
        <p className="authLogo">Q-Ket</p>
        <h1 className="authTitle">로그인</h1>
        <p className="authDesc">공연을 예매하려면 로그인이 필요합니다.</p>

        <FormField label="아이디">
          <Input
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </FormField>

        <FormField label="비밀번호">
          <Input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}

            //엔터 키 입력 시 handleLogin() 실행
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </FormField>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <Button
          variant="primary"
          fullWidth
          onClick={handleLogin}          // 로그인 버튼 클릭 시 handleLogin() 실행
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </Button>

        <div className="authDivider"><span>또는</span></div>

        {/* 소셜 로그인: fetch가 아니라 전체 페이지 이동 — 브라우저가 백엔드의 OAuth 리다이렉트를 그대로 따라가야 함 */}
        <a href="/api/oauth2/authorize/google" className="btnSocial btnGoogle">
          <svg className="btnSocialIcon" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
          </svg>
          Google로 계속하기
        </a>
        <a href="/api/oauth2/authorize/kakao" className="btnSocial btnKakao">
          <svg className="btnSocialIcon" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#391B1B" d="M9 1.5C4.5 1.5 1 4.36 1 7.9c0 2.24 1.44 4.22 3.62 5.36-.16.58-.58 2.1-.66 2.42-.1.4.15.4.31.29.13-.09 2.06-1.4 2.9-1.97.6.09 1.22.13 1.83.13 4.5 0 8-2.86 8-6.23S13.5 1.5 9 1.5z" />
          </svg>
          카카오로 계속하기
        </a>
        <a href="/api/oauth2/authorize/naver" className="btnSocial btnNaver">
          <svg className="btnSocialIcon" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#ffffff" d="M4 3h3.4l4.2 6.2V3H15v12h-3.4L7.4 8.8V15H4V3z" />
          </svg>
          네이버로 계속하기
        </a>

        <p className="authHelper">
          계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
        <p className="authHelper">
          <Link href="/find-password">비밀번호를 잊으셨나요?</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
