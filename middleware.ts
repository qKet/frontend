import { NextRequest, NextResponse } from "next/server";

// /admin/*, /performances/* 라우트에 대한 서버 단 접근 제어.
// 아래 클라이언트 사이드 체크는 화면이 이미 뜬 "다음"에 확인하는 거라 이것보다 늦음)
//
// 기존에는 각 admin 페이지(app/admin/*/page.tsx)가 클라이언트 컴포넌트 안에서
// useEffect(() => { if (userSession.roleId !== 3) router.replace("/") })로만 막고 있었음.
// 문제는 이게 "브라우저에 페이지가 이미 로드되고 컴포넌트가 마운트된 뒤" 실행되는 클라이언트
// 사이드 체크라는 것 — 즉 (1) 리다이렉트가 일어나기 전 짧은 순간 관리자 페이지의 JS 번들이
// 그대로 실행되고 관리자 전용 API 요청까지 나갈 수 있고, (2) 애초에 그 페이지의 코드 자체는
// 로그인 여부와 무관하게 누구나 다운로드해서 볼 수 있음.
//
// 여기서는 요청이 실제 페이지 컴포넌트에 도달하기 전에, 백엔드 세션(쿠키)을 그대로 넘겨서
// /api/auth/me로 역할을 확인하고, 그 경로에 허용된 역할이 아니면 그 자리에서 "/"로 리다이렉트함.
// 기존 클라이언트 사이드 체크는 그대로 둬도 됨(이중 방어 — 여기서 미들웨어를 우회할 방법을
// 찾더라도 클라이언트 쪽에서 한 번 더 막힘).
const BASE_URL = process.env.CLUSTER_IP ?? "http://localhost:8080";

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie");

  //   /admin/*        → 관리자(roleId 3)만
  //   /performances/* → 공연 등록/수정 화면. 매니저(roleId 2)도 쓸 수 있는 기능이라
  //                      관리자와 매니저 둘 다 허용
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const allowedRoleIds = isAdminPath ? [3] : [2, 3];

  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: cookie ? { cookie } : {},
    });

    const data = await res.json().catch(() => null);
    const roleId = data?.success ? data.user?.roleId : undefined;

    if (!allowedRoleIds.includes(roleId)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // 백엔드 자체가 응답을 못 주는 경우(장애/배포 중) — 관리자 페이지 접근을 안전하게 차단
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/performances/:path*"],
};
