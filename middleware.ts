import { NextRequest, NextResponse } from "next/server";

// /admin/*, /performances/*, 그리고 로그인 회원 전용 페이지(/mypage, /seats, /payments/checkout)에
// 대한 서버 단 접근 제어 — 클라이언트 사이드 useEffect 체크만으로는 리다이렉트 전에 페이지
// JS/API 요청이 먼저 나갈 수 있어서, 요청이 페이지에 도달하기 전에 백엔드 세션(쿠키)으로
// /api/auth/me를 확인해 역할이 안 맞으면 여기서 바로 리다이렉트함. 클라이언트 체크는 이중
// 방어로 그대로 둠. 로그인 전용 페이지들은 역할 화이트리스트 대신 로그인 여부만 봄.
const BASE_URL = process.env.CLUSTER_IP ?? "http://localhost:8080";

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  const pathname = request.nextUrl.pathname;

  //   /admin/*                                        → 관리자(roleId 3)만
  //   /performances/*                                  → 공연 등록/수정 화면. 매니저(roleId 2)도
  //                                                       쓸 수 있는 기능이라 관리자와 매니저 둘 다 허용
  //   /mypage, /seats/*, /payments/checkout            → 로그인한 회원이면 역할 무관 누구나 허용
  const isAdminPath = pathname.startsWith("/admin");
  const isManagerPath = pathname.startsWith("/performances");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: cookie ? { cookie } : {},
    });

    const data = await res.json().catch(() => null);
    const roleId = data?.success ? data.user?.roleId : undefined;
    const isLoggedIn = roleId !== undefined;

    if (isAdminPath) {
      if (roleId !== 3) return NextResponse.redirect(new URL("/", request.url));
    } else if (isManagerPath) {
      if (roleId !== 2 && roleId !== 3) return NextResponse.redirect(new URL("/", request.url));
    } else if (!isLoggedIn) {
      // 회원 전용 페이지는 관리자 페이지와 달리 "/"가 아니라 로그인 화면으로 보냄 —
      // BookButton 등 다른 컴포넌트가 비로그인 상태에서 안내하는 방식과 동일하게 맞춤.
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    // 백엔드 자체가 응답을 못 주는 경우(장애/배포 중) — 안전하게 차단
    const fallback = isAdminPath || isManagerPath ? "/" : "/login";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/performances/:path*",
    "/mypage/:path*",
    "/seats/:path*",
    "/payments/checkout",
  ],
};
