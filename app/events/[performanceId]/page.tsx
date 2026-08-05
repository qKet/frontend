// Server Component — 데이터 조회 후 렌더링만 함 ("use client" 없음)
// 탭 전환/달력처럼 상태가 필요한 부분은 Client Component로 분리했다
// (components/PerformanceTabs.tsx, components/RoundCalendar.tsx).

import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import PerformanceTabs, { type RoundCastGroup } from "@/components/PerformanceTabs";
import RoundCalendar from "@/components/RoundCalendar";
import { BASE_URL, unwrap } from "@/lib/api/client";
import { formatRoundTime } from "@/lib/utils/datetime";
import type { PerformanceDetail } from "@/lib/data/types";

export default async function PerformanceDetailPage({
  params,
}: {
  params: { performanceId: string };
}) {
  const performanceId = Number(params.performanceId);

  // lib/api/events.ts 의 getEvent() 는 apiFetch 기반이라 상대경로("/api/...")를 쓴다.
  // 서버 컴포넌트에서는 상대경로 fetch가 안 되므로 여기서는 절대경로로 직접 호출하고
  // unwrap 으로 { success, data, ... } 래퍼를 벗긴다 (app/page.tsx 와 같은 방식).
  const res = await fetch(`${BASE_URL}/api/events/${performanceId}`, { cache: "no-store" });

  // 없는 공연이면 백엔드가 400(C001)을 준다 → 화면에서는 404로 처리
  if (!res.ok) notFound();

  const detail = unwrap(await res.json()) as PerformanceDetail;

  // 전체 회차 공통 캐스팅
  const commonCasts = detail.casts
    .filter((cast) => cast.roundId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // 회차별 캐스팅 — 회차 순서대로 묶음. 캐스팅이 없는 회차는 제외
  const roundCasts: RoundCastGroup[] = detail.rounds
    .map((round) => ({
      roundId: round.roundId,
      roundLabel: formatRoundTime(round.roundTime),
      casts: detail.casts
        .filter((cast) => cast.roundId === round.roundId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((group) => group.casts.length > 0);

  // 상단 요약에 쓰는 "배우 수" — casts 배열 길이를 그대로 쓰면 회차별 중복 출연이 이중으로 세어져
  // (예: 3회차 모두 나오는 배우가 3명으로 계산됨) 실제 배우 수보다 크게 보인다. 이름 기준으로 중복 제거.
  const actorCount = new Set(detail.casts.map((cast) => cast.actorName)).size;

  return (
    // 제목은 이 헤더에만 둔다 — 아래 포스터 옆에도 제목을 넣었더니 한 화면에 두 번 나왔음.
    // 공연장은 헤더 부제에서 빼고 오른쪽 상세 정보(detailMeta)에만 둔다 (같은 이유로 중복이었음).
    <PageHeader title={detail.pTitle}>
      <div className="detailTop">
        <div className="detailPoster">
          {detail.posterUrl
            ? <img src={detail.posterUrl} alt={detail.pTitle} />
            : <div className="detailPosterEmpty" />}
        </div>

        <div className="detailInfo">
          <dl className="detailMeta">
            <div className="detailMetaRow">
              <dt>공연장</dt>
              <dd>{detail.pLocation}</dd>
            </div>
            <div className="detailMetaRow">
              <dt>회차</dt>
              <dd>총 {detail.rounds.length}회</dd>
            </div>
            <div className="detailMetaRow">
              <dt>출연</dt>
              <dd>
                {actorCount > 0
                  ? `배우 ${actorCount}명${roundCasts.length > 0 ? " · 회차별 캐스팅 있음" : ""}`
                  : "정보 없음"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 회차 — 달력에서 날짜를 고르면 아래 목록이 그 날짜만 남는다.
          달을 옮기면 RoundCalendar 가 /calendar?month= 로 그 달 회차를 다시 받아온다 */}
      <RoundCalendar
        performanceId={detail.performanceId}
        rounds={detail.rounds}
        title={detail.pTitle}
        location={detail.pLocation}
        posterUrl={detail.posterUrl}
      />

      {/* 출연진 / 감상평 탭 */}
      <PerformanceTabs commonCasts={commonCasts} roundCasts={roundCasts} />
    </PageHeader>
  );
}
