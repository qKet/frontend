"use client";

// 공연 상세 화면의 회차 달력(PER02_DETAIL02). 날짜 클릭은 이미 받아둔 그 달 회차를 클라이언트
// 에서 필터링만 하고(요청 없음), 달 이동(◀ ▶)만 GET .../calendar?month=YYYY-MM으로 다시 받아옴.
// props.rounds(상세 응답의 전체 회차)는 첫 화면에 보여줄 달을 정하고 이동 가능 범위를 계산하는 데 씀.

import { useMemo, useState } from "react";
import BookButton from "@/components/BookButton";
import OpenAlertToggle from "@/components/OpenAlertToggle";
import { getEventCalendar } from "@/lib/api/events";
import { formatRoundTime, parseDateTime } from "@/lib/utils/datetime";
import type { PerformanceRound } from "@/lib/data/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 오른쪽 회차 목록을 한 번에 보여줄 개수.
// 회차가 많은 공연(레미제라블 8월 10건)이면 목록이 달력보다 훨씬 길어져서 화면이 늘어지므로
// 달력 높이와 비슷해지는 6건씩 끊고 화살표로 넘긴다.
const LIST_PAGE_SIZE = 6;

type Props = {
  performanceId: number;
  rounds: PerformanceRound[];
  title: string;
  location: string;
  posterUrl?: string;
};

type DatedRound = PerformanceRound & {
  year: number;
  month: number;
  day: number;
};

export default function RoundCalendar({ performanceId, rounds, title, location, posterUrl }: Props) {
  // 회차마다 연/월/일을 미리 뽑아둔다 (달력 칸과 대조할 때 매번 파싱하지 않도록)
  const dated: DatedRound[] = useMemo(
    () =>
      rounds.map((round) => {
        const { year, month, day } = parseDateTime(round.roundTime);
        return { ...round, year, month, day };
      }),
    [rounds]
  );

  // "오늘"이 속한 달 — 회차가 하나도 없어도 이 달 기준 앞뒤로 둘러볼 수 있게 하는 기준점
  const todayKey = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 12 + d.getMonth();
  }, []);

  // 달 이동 가능 범위 — 예전엔 "회차가 있는 달"로만 좁혀서, 회차가 몰려있지 않은 공연은 오늘 날짜
  // 근처를 둘러볼 수조차 없었음(2026-08-21). 이제 회차가 있는 달 범위 ∪ 오늘 기준 앞뒤 2달을 더해서,
  // 회차 유무와 무관하게 최소한 "지금 이 주변" 달력은 항상 넘겨볼 수 있게 함(예: 8월이면 6~10월).
  const monthKeys = useMemo(() => {
    const keys = dated.map((r) => r.year * 12 + (r.month - 1));
    const dataMin = keys.length > 0 ? Math.min(...keys) : todayKey;
    const dataMax = keys.length > 0 ? Math.max(...keys) : todayKey;
    return {
      min: Math.min(dataMin, todayKey - 2),
      max: Math.max(dataMax, todayKey + 2),
    };
  }, [dated, todayKey]);

  // 첫 화면은 "오늘이 속한 달"부터 — 회차가 나중 달에 몰려있어도 지금 날짜 기준 달력이 먼저 보임
  const [viewKey, setViewKey] = useState<number>(todayKey);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 달 이동 때 서버에서 다시 받아온 회차를 달("YYYY-MM")별로 저장.
  // 여기 없는 달은 상세 응답(props.rounds)에 들어있던 회차를 그대로 쓴다.
  const [refreshed, setRefreshed] = useState<Record<string, PerformanceRound[]>>({});
  const [loading, setLoading] = useState(false);
  // 오른쪽 목록의 현재 페이지(0부터). 달을 옮기거나 날짜를 고르면 1페이지로 되돌린다
  const [listPage, setListPage] = useState(0);

  const viewYear = Math.floor(viewKey / 12);
  const viewMonth = (viewKey % 12) + 1;
  const monthKey = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;

  // 이 달에 속한 회차 — 다시 받아온 게 있으면 그걸 우선 사용
  const fresh = refreshed[monthKey];
  const roundsThisMonth: DatedRound[] = fresh
    ? fresh.map((round) => {
        const { year, month, day } = parseDateTime(round.roundTime);
        return { ...round, year, month, day };
      })
    : dated.filter((r) => r.year === viewYear && r.month === viewMonth);

  // 회차가 있는 날짜는 전부 클릭 가능(지난 회차도 목록은 볼 수 있음). 보라색 점(daysWithFutureRound)은
  // "지금 예매 가능성이 있는 날"만 표시하고, 지난 회차만 있는 날은 점 없이 글씨만 회색 처리 —
  // BookButton의 "closed" 판정 기준(now >= roundTime)과 동일.
  const now = Date.now();
  const daysWithAnyRound = new Set(roundsThisMonth.map((r) => r.day));
  const daysWithFutureRound = new Set(
    roundsThisMonth
      .filter((r) => new Date(r.roundTime.replace(" ", "T")).getTime() > now)
      .map((r) => r.day)
  );

  // 달력 격자 계산 — Date.UTC 로 만들어 실행 환경 타임존과 무관하게 같은 요일이 나오게 함
  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const canPrev = viewKey > monthKeys.min;
  const canNext = viewKey < monthKeys.max;

  const moveMonth = async (delta: number) => {
    const nextKey = viewKey + delta;
    setViewKey(nextKey);
    setSelectedDay(null); // 달이 바뀌면 날짜 선택은 해제 (다른 달의 날짜였으므로)
    setListPage(0);

    const nextYear = Math.floor(nextKey / 12);
    const nextMonth = (nextKey % 12) + 1;
    const key = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
    if (refreshed[key]) return; // 이미 받아온 달이면 다시 요청하지 않음

    setLoading(true);
    try {
      const rows = await getEventCalendar(performanceId, key);
      setRefreshed((prev) => ({ ...prev, [key]: rows }));
    } catch {
      // 조회에 실패해도 상세 응답에 들어있던 회차로 계속 보여준다 (화면이 비지 않도록)
    } finally {
      setLoading(false);
    }
  };

  // 목록에 보여줄 회차 — 날짜를 고르면 그 날짜만, 아니면 이 달 전체
  const listed =
    selectedDay === null
      ? roundsThisMonth
      : roundsThisMonth.filter((r) => r.day === selectedDay);

  // 6건씩 끊어서 보여주기.
  // listPage 를 그대로 쓰지 않고 범위를 다시 좁히는 이유: 2페이지를 보던 중에 날짜를 고르거나
  // 달을 옮겨 목록이 짧아지면 없는 페이지를 가리켜 빈 목록이 나올 수 있다.
  const totalListPages = Math.max(1, Math.ceil(listed.length / LIST_PAGE_SIZE));
  const safeListPage = Math.min(listPage, totalListPages - 1);
  const pagedRounds = listed.slice(
    safeListPage * LIST_PAGE_SIZE,
    safeListPage * LIST_PAGE_SIZE + LIST_PAGE_SIZE
  );

  return (
    <section className="detailSection">
      <h3 className="detailSectionTitle">회차</h3>

      {/* 왼쪽 = 달력, 오른쪽 = 선택한 날짜(또는 그 달 전체)의 회차 목록.
          좁은 화면에서는 responsive.css 가 세로로 쌓는다 */}
      <div className="calendarLayout">
        <div className="calendarPane">
          <div className="calendarHeader">
            <button
              type="button"
              className="calendarNav"
              onClick={() => moveMonth(-1)}
              disabled={!canPrev}
              aria-label="이전 달"
            >
              ‹
            </button>
            <span className="calendarMonth">
              {viewYear}년 {viewMonth}월
            </span>
            <button
              type="button"
              className="calendarNav"
              onClick={() => moveMonth(1)}
              disabled={!canNext}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>

          <div className="calendarDow">
            {WEEKDAYS.map((name) => (
              <span key={name} className="calendarDowCell">
                {name}
              </span>
            ))}
          </div>

          <div className="calendarGrid">
            {/* 1일이 시작하는 요일만큼 빈 칸을 채워서 요일을 맞춤 */}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <span key={`pad-${i}`} className="calendarCell calendarCellEmpty" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const hasAnyRound = daysWithAnyRound.has(day);
              const hasFutureRound = daysWithFutureRound.has(day);
              const isSelected = selectedDay === day;

              // 회차가 아예 없는 날은 버튼이 아니라 그냥 숫자로 (누를 게 없음)
              if (!hasAnyRound) {
                return (
                  <span key={day} className="calendarCell calendarCellMuted">
                    {day}
                  </span>
                );
              }

              // 지난 회차만 있는 날 — 클릭은 되지만(목록에서 확인 가능) 점 없이 글씨만 옅게
              const cellClass = hasFutureRound ? "calendarCellHas" : "calendarCellPast";

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendarCell ${cellClass}${isSelected ? " calendarCellSelected" : ""}`}
                  aria-pressed={isSelected}
                  aria-label={`${viewMonth}월 ${day}일 회차 보기`}
                  // 같은 날짜를 다시 누르면 선택 해제 → 이 달 전체로 돌아감
                  onClick={() => {
                    setSelectedDay(isSelected ? null : day);
                    setListPage(0);
                  }}
                >
                  {day}
                  {hasFutureRound && <span className="calendarDot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="calendarListPane">
          <div className="calendarListHeader">
        <span className="calendarListLabel">
          {loading
            ? "불러오는 중..."
            : selectedDay === null
              ? `${viewMonth}월 전체 회차 ${listed.length}건`
              : `${viewMonth}월 ${selectedDay}일 회차 ${listed.length}건`}
            </span>

            <div className="calendarListActions">
              {selectedDay !== null && (
                <button
                  type="button"
                  className="calendarClear"
                  onClick={() => {
                    setSelectedDay(null);
                    setListPage(0);
                  }}
                >
                  전체 보기
                </button>
              )}

              {/* 6건을 넘길 때만 페이지 화살표 노출 */}
              {totalListPages > 1 && (
                <div className="listPager">
                  <button
                    type="button"
                    className="listPagerBtn"
                    onClick={() => setListPage(safeListPage - 1)}
                    disabled={safeListPage === 0}
                    aria-label="이전 회차 목록"
                  >
                    ‹
                  </button>
                  <span className="listPagerLabel">
                    {safeListPage + 1} / {totalListPages}
                  </span>
                  <button
                    type="button"
                    className="listPagerBtn"
                    onClick={() => setListPage(safeListPage + 1)}
                    disabled={safeListPage >= totalListPages - 1}
                    aria-label="다음 회차 목록"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="roundList">
            {listed.length === 0 ? (
              <p className="detailEmpty">이 달에는 등록된 회차가 없습니다.</p>
            ) : (
              pagedRounds.map((round) => (
                <div key={round.roundId} className="roundRow">
                  <span className="roundTime">{formatRoundTime(round.roundTime)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <OpenAlertToggle roundId={round.roundId} openTime={round.openTime} />
                    <BookButton
                      roundId={round.roundId}
                      performanceId={performanceId}
                      roundTime={round.roundTime}
                      openTime={round.openTime}
                      title={title}
                      location={location}
                      posterUrl={posterUrl}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
