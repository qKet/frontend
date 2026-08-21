// 관리자가 공연을 등록/수정/삭제한 직후 홈 화면에 바로 반영되게 하기 위한 온디맨드 재검증.
//
// app/page.tsx의 공연 목록 fetch는 `next: { revalidate: 60 }`로 캐시된다 — 대량 트래픽 부하테스트에서
// 홈이 제일 먼저 무너졌던 문제(frontend#27) 때문에 일부러 60초 캐시를 걸어둔 것이라, 이 값 자체를
// 낮추면 안 됨(일반 사용자 트래픽 전체에 영향). 대신 "공연을 실제로 바꾼 그 순간"에만
// revalidatePath("/")를 호출해서, 캐시 정책은 그대로 두고 관리자 화면에서만 즉시 반영되게 함.
//
// 경로가 "/api/revalidate"가 아니라 "/revalidate"인 이유: 프로덕션에서는 ALB Ingress가 "/api/*"를
// Next.js 서버를 거치지 않고 backend Service로 바로 꽂아버림(next.config.mjs rewrites() 주석 참고).
// "/api" 아래에 이 라우트를 두면 배포 환경에서 이 코드가 아예 호출되지 않고 404가 남.
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidatePath("/");
  return NextResponse.json({ revalidated: true });
}
