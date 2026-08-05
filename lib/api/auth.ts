import { apiFetch } from "./client";
import type { LoginResult, ApiResult, UserDTO } from "../data/types";

// ============================================================
// POST /api/auth/login
// 백엔드: UserController.java → login()
// 기능: 로그인 — 성공하면 서버가 세션 쿠키를 내려줌 (credentials: "include" 로 브라우저가 자동 저장)
//
// 사용 예시:
//   import { login } from "@/lib/api/auth";
//
//   const handleLogin = async () => {
//     try {
//       const result = await login(userId, pwd);
//       setUserSession(result.user ?? null);   // useAuth() 의 setUserSession
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "userId": "test01", "pwd": "1234" }
//
// 응답 JSON (백엔드 → 프론트, 성공 시):
//   { "success": true, "user": { "userId": "test01", "userNm": "홍길동", "roleId": 1 } }
// 실패 시 (401) apiFetch 가 자동으로 Error를 던짐 → catch(e) { setError(e.message) }
// ============================================================
export async function login(userId: string, pwd: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { userId, pwd },
  });
}

// ============================================================
// POST /api/auth/logout
// 백엔드: UserController.java → logout()
// 기능: 로그아웃 — 서버 세션 제거
//
// 사용 예시:
//   await logout();
//   setUserSession(null);   // useAuth() 의 setUserSession — 이걸 꼭 같이 해줘야 화면도 로그아웃 상태로 바뀜
//
// 요청: body 없음
// 응답 JSON: { "success": true }
// ============================================================
export async function logout(): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/logout", { method: "POST" });
}

// ============================================================
// POST /api/auth/signup
// 백엔드: UserController.java → register()
// 기능: 회원가입
//
// 사용 예시:
//   try {
//     await signup(userId, userNm, userEmail, pwd);
//     router.push("/login");
//   } catch (e: any) {
//     setError(e.message);
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "userId": "test01", "userNm": "홍길동", "userEmail": "a@a.com", "pwd": "1234" }
//
// 응답 JSON:
//   성공: { "success": true, "message": "회원가입이 완료되었습니다." }
//   실패: { "success": false, "message": "..." } → apiFetch 가 Error 로 throw
// ============================================================
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

// ============================================================
// GET /api/auth/me
// 백엔드: UserController.java → me()  (세션에 저장된 로그인 유저 정보를 그대로 돌려줌)
// 기능: 현재 세션이 로그인 상태인지 확인 + 로그인 상태면 유저 정보 반환
//
// 응답 JSON:
//   로그인 상태: { "success": true, "user": { "userId": "...", "userNm": "...", "roleId": 1 } }
//   비로그인:   { "success": false, "message": "로그인이 필요합니다." }
//   (참고: 백엔드가 이 경우도 200 OK 로 내려주기 때문에 아래 코드는 success 값만 보고 분기함)
//
// 주의: 이 함수는 AuthContext.tsx 안에서만 호출됨 — 다른 화면에서 로그인 유저 정보가 필요하면
//       여기서 또 부르지 말고 useAuth() 훅으로 Context에 저장된 값을 가져다 쓸 것
//       (여기서 또 부르면 Context가 들고 있는 세션값이랑 따로 노는 이중 상태가 생김)
//   예시: const { userSession, isLoading } = useAuth();
// ============================================================
export async function getMe(): Promise<UserDTO | null> {
  try {
    const data = await apiFetch<{ success: boolean; user: UserDTO }>("/auth/me");
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}
