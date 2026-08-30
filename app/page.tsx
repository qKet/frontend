// Server Component — "use client" 없음
// 서버에서 실행되므로 useState, useEffect, useRouter 사용 불가
// 데이터는 async/await 로 직접 fetch, 네비게이션은 <Link> 사용

import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import StatusMessage from "@/components/ui/StatusMessage";
import { BASE_URL, unwrap } from "@/lib/api/client";
import { parseDateTime } from "@/lib/utils/datetime";
import type { Category, PageResponse } from "@/lib/data/types";

// 백엔드 PerformanceDTO 와 일치
type Round = {
  roundId: number;
  roundTime: string;
  openTime: string;
  roundStatus: "OPEN" | "CLOSED" | "SOLDOUT";
};
type Performance = {
  performanceId: number;
  pTitle: string;
  pLocation: string;
  posterUrl: string;
  categoryId: number;
  categoryNm: string;
  rounds: Round[];
};

// 한 페이지에 보여줄 공연 개수 — 백엔드 PerformanceController.pagedList()의 size 기본값(8)과 맞춤
const PAGE_SIZE = 8;

// 카드에 붙일 상태 뱃지 3가지 (Badge 컴포넌트의 variant 와 표시 문구)
const CARD_STATUS = {
  OPEN: { variant: "open", label: "예매 가능" },
  BEFORE: { variant: "closed", label: "예매 전" },
  SOLDOUT: { variant: "soldout", label: "매진" },
  CLOSED: { variant: "closed", label: "예매 마감" },
} as const;

type CardStatus = keyof typeof CARD_STATUS;

// 카드용 회차 요약 — 회차 수가 공연마다 제각각(2~12회)이라 전부 나열하면 카드 높이가 들쭉날쭉해지고
// 회차마다 붙는 BookButton의 타이머도 낭비라, "기간 + 회차 수 + 상태" 한 줄로 줄임(회차 선택/예매는 상세 화면).
function summarizeRounds(rounds: Round[]): { schedule: string; status: CardStatus } {
  if (rounds.length === 0) return { schedule: "회차 미정", status: "BEFORE" };

  const pad = (n: number) => String(n).padStart(2, "0");
  const sorted = [...rounds].map((r) => r.roundTime).sort();
  const first = parseDateTime(sorted[0]);
  const last = parseDateTime(sorted[sorted.length - 1]);

  const start = `${first.year}.${pad(first.month)}.${pad(first.day)}`;
  const schedule =
    sorted.length === 1
      ? start
      : first.year === last.year
        ? `${start} ~ ${pad(last.month)}.${pad(last.day)}`
        : `${start} ~ ${last.year}.${pad(last.month)}.${pad(last.day)}`;

  // 오픈 시각 비교는 서버에서만 계산된다(Server Component라 클라이언트 재렌더가 없어
  // 하이드레이션 불일치 걱정은 없음). 시드의 open_time 은 전부 과거라 경계값 이슈도 없다.
  const now = Date.now();

  // 공연 시각(roundTime) 자체가 이미 지난 회차는 오픈 시각과 무관하게 예매가 불가능함
  // (상세 화면의 BookButton과 동일한 기준 — "closed" 상태). 이걸 안 거르면 회차가 전부
  // 과거인 공연도 "예매 가능"으로 잘못 표시됨(오픈 시각만 보고 판단했었기 때문).
  const upcoming = rounds.filter(
    (r) => new Date(r.roundTime.replace(" ", "T")).getTime() > now
  );

  const status: CardStatus =
    upcoming.length === 0
      ? "CLOSED"
      : upcoming.every((r) => r.roundStatus === "SOLDOUT")
        ? "SOLDOUT"
        : upcoming.some((r) => new Date(r.openTime.replace(" ", "T")).getTime() <= now)
          ? "OPEN"
          : "BEFORE";

  return { schedule, status };
}


export default async function EventsPage({
  searchParams,
}: {
  searchParams: { page?: string; categoryId?: string; keyword?: string };
}) {
  const page = Math.max(Number(searchParams.page) || 1, 1);
  const categoryId = searchParams.categoryId ? Number(searchParams.categoryId) : undefined;
  const keyword = searchParams.keyword?.trim() || undefined;

  const eventsQuery = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (categoryId != null) eventsQuery.set("categoryId", String(categoryId));
  if (keyword) eventsQuery.set("keyword", keyword);

  // 카테고리/공연 목록은 잘 안 바뀌는 데이터라 1분 단위로 재검증(no-store 대신) — 홈이 트래픽이
  // 제일 몰리는 페이지라 부하테스트에서 가장 먼저 무너진 원인이었음.
  // 카테고리 목록 + events api 호출 (페이지 단위, 카테고리 필터·검색어 포함)
  const [categoriesRes, res] = await Promise.all([
    fetch(`${BASE_URL}/api/categories`, { next: { revalidate: 60 } }),
    fetch(`${BASE_URL}/api/events/paged?${eventsQuery.toString()}`, {
      next: { revalidate: 60 },
    }),
  ]);
  // GET /api/events/paged, /api/categories 는 GlobalResponseAdvice가
  // { success, message, data, timestamp }로 감싸서 내려주므로 apiFetch를 안 거치는 이 직접 fetch()에서도
  // unwrap으로 data만 꺼내야 함
  const categories = unwrap(await categoriesRes.json()) as Category[];
  const pageData = unwrap(await res.json()) as PageResponse<Performance>;
  const performances = pageData.content;

  const keywordQuery = keyword ? `keyword=${encodeURIComponent(keyword)}` : "";

  return (
    <PageHeader title="공연 목록" subtitle="예매하고 싶은 공연을 선택하세요.">
      <SearchBar defaultValue={keyword} categoryId={categoryId} />

      <div className="categoryFilterBar">
        <Link
          href={keyword ? `/?${keywordQuery}` : "/"}
          className={`categoryChip${categoryId == null ? " categoryChipActive" : ""}`}
        >
          전체
        </Link>
        {categories.map((c) => (
          <Link
            key={c.categoryId}
            href={`/?categoryId=${c.categoryId}${keyword ? `&${keywordQuery}` : ""}`}
            className={`categoryChip${categoryId === c.categoryId ? " categoryChipActive" : ""}`}
          >
            {c.categoryNm}
          </Link>
        ))}
      </div>

      {performances.length === 0 && (
        <StatusMessage variant="loading">등록된 공연이 없습니다.</StatusMessage>
      )}

      <div className="eventGrid">
        {performances.map((performance) => {
          const { schedule, status } = summarizeRounds(performance.rounds ?? []);
          const badge = CARD_STATUS[status];

          return (
            // 카드 안에 버튼이 없어졌으므로 카드 전체를 링크로 감쌀 수 있다
            // (예전엔 예매 버튼 때문에 <a> 안에 <button>이 들어가는 문제로 포스터+제목만 감쌌음)
            <Link
              key={performance.performanceId}
              href={`/events/${performance.performanceId}`}
              className="eventCard eventCardLink"
              aria-label={`${performance.pTitle} 상세 보기`}
            >
              <div className="eventPoster">
                {/* posterUrl 이 있으면 이미지, 없으면 기본 배경  */}
                {performance.posterUrl
                  ? <img src={performance.posterUrl} alt={performance.pTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "var(--surface2)" }} />
                }
              </div>

              <div className="eventInfoHead">
                <p className="eventTitle">{performance.pTitle}</p>
                <p className="eventLocation">{performance.pLocation}</p>

                <div className="eventSummary">
                  <span className="eventSchedule">
                    {schedule}
                    {performance.rounds?.length > 0 && ` · 총 ${performance.rounds.length}회차`}
                  </span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Pagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        basePath="/"
        extraQuery={{ categoryId, keyword }}
      />
    </PageHeader>
  );
}
