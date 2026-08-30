import { apiFetch } from "./client";
import type { LoginResult, ApiResult, UserDTO } from "../data/types";

// POST /api/auth/login — UserController.login()
// 로그인 성공 시 서버가 세션 쿠키를 내려줌(credentials: "include"로 브라우저가 자동 저장).
export async function login(userId: string, pwd: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { userId, pwd },
  });
}

// POST /api/auth/logout — UserController.logout()
export async function logout(): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/logout", { method: "POST" });
}

// GET /api/auth/check-id — UserController.checkUserId()
// 회원가입 폼 "중복확인" — 이미 사용 중이면 apiFetch가 Error(A011)를 throw.
export async function checkUserId(userId: string): Promise<ApiResult> {
  return apiFetch<ApiResult>(`/auth/check-id?userId=${encodeURIComponent(userId)}`);
}

// POST /api/auth/signup — UserController.register()
export async function signup(
  userId: string,
  userNm: string,
  userEmail: string,
  pwd: string
): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/signup", {
    method: "POST",
    body: { userId, userNm, userEmail, pwd },
  });
}

// POST /api/auth/email/verification-codes — EmailVerificationController.send()
// 이메일로 6자리 인증번호 발송(SQS → Lambda → SES), 5분 TTL.
export async function sendEmailVerificationCode(email: string): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/email/verification-codes", {
    method: "POST",
    body: { email },
  });
}

// POST /api/auth/email/verification-codes/confirm — EmailVerificationController.confirm()
// 통과하면 30분간 "인증완료" 상태(그 사이에 /auth/signup 호출해야 함).
export async function confirmEmailVerificationCode(email: string, code: string): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/email/verification-codes/confirm", {
    method: "POST",
    body: { email, code },
  });
}

// GET /api/auth/me — UserController.me()
// 현재 세션 로그인 여부 확인 + 유저 정보 반환. 비로그인도 200으로 내려와서 success 값만 보고 분기함.
// 주의: AuthContext.tsx 안에서만 호출 — 다른 화면은 useAuth() 훅으로 Context 값을 가져다 쓸 것
// (여기서 또 부르면 Context 세션값과 따로 노는 이중 상태가 생김).
export async function getMe(): Promise<UserDTO | null> {
  try {
    const data = await apiFetch<{ success: boolean; user: UserDTO }>("/auth/me");
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

// POST /api/auth/password/code — UserController.requestPasswordResetCode()
// 비밀번호 찾기 1단계 — 아이디+이메일 일치 계정에 재설정 링크 이메일 발송(SQS → Lambda → SES).
export async function requestPasswordResetCode(userId: string, userEmail: string): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/password/code", {
    method: "POST",
    body: { userId, userEmail },
  });
}

// POST /api/auth/password/reset — UserController.resetPassword()
// 비밀번호 찾기 2단계 — 이메일 링크의 1회용 토큰(15분 만료) 확인 후 새 비밀번호로 변경.
// 링크로 열리는 페이지: app/(auth)/find-password/confirm/page.tsx
export async function resetPassword(token: string, newPwd: string): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/password/reset", {
    method: "POST",
    body: { token, newPwd },
  });
}
