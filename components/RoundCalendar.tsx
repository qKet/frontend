"use client";

// 공연 상세 화면의 회차 달력 (PER02_DETAIL02).
// 달력에서 날짜를 고르면 아래 회차 목록이 그 날짜만 남는 "필터" 방식이고,
// 달 이동(◀ ▶)은 보고 있는 달을 바꾼다.
//
// [요청 시점]
//  · 날짜 클릭 → 요청 없음. 이미 받아둔 그 달 회차에서 걸러내기만 한다(누를 때마다 요청하면 반응이 느려짐).
//  · 달 이동   → GET /api/events/{performanceId}/calendar?month=YYYY-MM 으로 그 달 회차를 다시 받아온다.
//
// props.rounds(상세 응답에 들어있는 전체 회차)는 두 가지 용도로만 쓴다:
//  ① 첫 화면에 보여줄 달을 정하고 ② 달 이동 가능 범위를 계산.
// 처음 보는 달의 회차는 이미 rounds 안에 있어서 추가 요청 없이 그린다.

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

  // 회차가 존재하는 달의 범위 — 이 밖으로는 달 이동을 막아서 빈 달을 계속 넘기지 않게 함
  const monthKeys = useMemo(() => {
    const keys = dated.map((r) => r.year * 12 + (r.month - 1));
    return keys.length > 0
      ? { min: Math.min(...keys), max: Math.max(...keys) }
      : null;
  }, [dated]);

  // 첫 회차가 있는 달부터 보여준다
  const [viewKey, setViewKey] = useState<number>(() =>
    monthKeys ? monthKeys.min : new Date().getUTCFullYear() * 12
  );
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

  // 이미 공연 시각이 지난 회차는 달력 표시(보라색 점)에서 제외 — BookButton의 "closed" 판정
  // 기준(now >= roundTime)과 동일하게 맞춤. 날짜 자체는 여전히 숫자로 보이지만(muted 스타일),
  // 클릭 가능한 "회차 있음" 표시는 안 함 — 지난 회차를 예매 가능한 것처럼 보여주지 않기 위함.
  const now = Date.now();
  const daysWithRound = new Set(
    roundsThisMonth
      .filter((r) => new Date(r.roundTime.replace(" ", "T")).getTime() > now)
      .map((r) => r.day)
  );

  // 달력 격자 계산 — Date.UTC 로 만들어 실행 환경 타임존과 무관하게 같은 요일이 나오게 함
  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const canPrev = monthKeys !== null && viewKey > monthKeys.min;
  const canNext = monthKeys !== null && viewKey < monthKeys.max;

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
              const hasRound = daysWithRound.has(day);
              const isSelected = selectedDay === day;

              // 회차가 없는 날은 버튼이 아니라 그냥 숫자로 (누를 게 없음)
              if (!hasRound) {
                return (
                  <span key={day} className="calendarCell calendarCellMuted">
                    {day}
                  </span>
                );
              }

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendarCell calendarCellHas${isSelected ? " calendarCellSelected" : ""}`}
                  aria-pressed={isSelected}
                  aria-label={`${viewMonth}월 ${day}일 회차 보기`}
                  // 같은 날짜를 다시 누르면 선택 해제 → 이 달 전체로 돌아감
                  onClick={() => {
                    setSelectedDay(isSelected ? null : day);
                    setListPage(0);
                  }}
                >
                  {day}
                  <span className="calendarDot" aria-hidden="true" />
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
