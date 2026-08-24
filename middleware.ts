import { NextRequest, NextResponse } from "next/server";

// /admin/*, /performances/*, 그리고 로그인 회원 전용 페이지(/mypage, /seats, /payments/checkout)에
// 대한 서버 단 접근 제어. 아래 클라이언트 사이드 체크는 화면이 이미 뜬 "다음"에 확인하는 거라
// 이것보다 늦음.
//
// 기존에는 각 admin 페이지(app/admin/*/page.tsx)가 클라이언트 컴포넌트 안에서
// useEffect(() => { if (userSession.roleId !== 3) router.replace("/") })로만 막고 있었음.
// 문제는 이게 "브라우저에 페이지가 이미 로드되고 컴포넌트가 마운트된 뒤" 실행되는 클라이언트
// 사이드 체크라는 것 — 즉 (1) 리다이렉트가 일어나기 전 짧은 순간 관리자 페이지의 JS 번들이
// 그대로 실행되고 관리자 전용 API 요청까지 나갈 수 있고, (2) 애초에 그 페이지의 코드 자체는
// 로그인 여부와 무관하게 누구나 다운로드해서 볼 수 있음.
//
// 2026-08-21: 같은 종류의 문제가 /mypage, /seats/[scheduleId], /payments/checkout에도 있었음 —
// 이 셋은 애초에 matcher에 없어서 미들웨어가 아예 안 보고 있었고, 페이지 자체에도(BookButton 등
// 다른 컴포넌트와 달리) 로그인 여부를 확인하는 코드가 없어서, 로그인 안 한 채로 URL을 직접 치면
// 화면이 그냥 열렸음(실제 예약/결제 API만 백엔드에서 401로 막히는 정도라 사용자가 헷갈림).
// 관리자/매니저 페이지와 같은 패턴으로 여기 추가함 — 다만 이 페이지들은 특정 역할이 아니라
// "로그인만 되어 있으면" 통과이므로 역할 화이트리스트 대신 로그인 여부만 봄.
//
// 여기서는 요청이 실제 페이지 컴포넌트에 도달하기 전에, 백엔드 세션(쿠키)을 그대로 넘겨서
// /api/auth/me로 역할을 확인하고, 그 경로에 허용된 역할이 아니면 그 자리에서 리다이렉트함.
// 기존 클라이언트 사이드 체크는 그대로 둬도 됨(이중 방어 — 여기서 미들웨어를 우회할 방법을
// 찾더라도 클라이언트 쪽에서 한 번 더 막힘).
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
