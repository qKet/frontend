"use client";

// 공연 상세 화면의 "출연진 / 감상평" 탭.
// 페이지(app/events/[performanceId]/page.tsx)는 Server Component 로 두고,
// 탭 전환 상태(useState)가 필요한 이 부분만 Client Component 로 분리했다.
// (BookButton 과 같은 패턴 — 서버 렌더링을 유지하면서 인터랙션만 클라이언트로 뺌)

import { useState } from "react";
import type { PerformanceCast } from "@/lib/data/types";

// 회차별 캐스팅 묶음. roundLabel 은 서버에서 formatRoundTime 으로 미리 만들어서 넘긴다
// (날짜 포맷 로직을 서버/클라이언트 양쪽에 두지 않기 위함)
export type RoundCastGroup = {
  roundId: number;
  roundLabel: string;
  casts: PerformanceCast[];
};

type Props = {
  commonCasts: PerformanceCast[];
  roundCasts: RoundCastGroup[];
};

type TabKey = "cast" | "review";

function CastList({ casts }: { casts: PerformanceCast[] }) {
  return (
    <ul className="castGrid">
      {casts.map((cast) => (
        <li key={cast.castId} className="castItem">
          {/* castingNm 이 null 인 공연(콘서트 등)은 배역 줄 자체를 그리지 않음 */}
          {cast.castingNm && <span className="castRole">{cast.castingNm}</span>}
          <span className="castName">{cast.actorName}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PerformanceTabs({ commonCasts, roundCasts }: Props) {
  const [tab, setTab] = useState<TabKey>("cast");

  const hasAnyCast = commonCasts.length > 0 || roundCasts.length > 0;

  return (
    <section className="detailSection">
      <div className="detailTabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cast"}
          className={`detailTab${tab === "cast" ? " detailTabActive" : ""}`}
          onClick={() => setTab("cast")}
        >
          출연진
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "review"}
          className={`detailTab${tab === "review" ? " detailTabActive" : ""}`}
          onClick={() => setTab("review")}
        >
          감상평
        </button>
      </div>

      {tab === "cast" && (
        <div role="tabpanel">
          {!hasAnyCast && (
            <p className="detailEmpty">등록된 출연진 정보가 없습니다.</p>
          )}

          {commonCasts.length > 0 && <CastList casts={commonCasts} />}

          {/* 회차마다 배우가 바뀌는 공연(뮤지컬 더블/트리플 캐스팅)만 노출 */}
          {roundCasts.length > 0 && (
            <div className="roundCastWrap">
              <h4 className="roundCastHeading">회차별 캐스팅</h4>
              {roundCasts.map((group) => (
                <div key={group.roundId} className="roundCastBlock">
                  <p className="roundCastTitle">{group.roundLabel}</p>
                  <CastList casts={group.casts} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "review" && (
        <div role="tabpanel">
          {/* ============================================================
              [TODO-REV01] 공연 감상평 — 아직 미구현 (담당자 미정)
              이 자리에 "감상평 목록 + 작성 폼"이 들어갑니다.

              관련 요구사항: REV01_REVIEW01~04, AI01_SPOIL01(스포일러 검열)

              API (project_design/Qket_3차_API명세서.xlsx 기준):
                GET    /api/events/{performanceId}/reviews   감상평 목록 조회   (공개)
                POST   /api/events/{performanceId}/reviews   감상평 작성       (로그인)
                PUT    /api/reviews/{reviewId}               감상평 수정       (본인만)
                DELETE /api/reviews/{reviewId}               감상평 삭제       (본인만)

              DB: REVIEWS 테이블은 아직 schema.sql 에 없습니다.
                  PER02(공연 상세/달력) 기능만 먼저 올리기로 해서 이번 스키마에서 제외됐고,
                  감상평 개발을 시작할 때 project_design/Qket_3차_스키마설계_초안.md 의
                  REVIEWS 정의를 schema.sql 에 추가해야 합니다.

              구현 시 주의:
                · 삭제는 물리삭제가 아니라 use_yn='N' 소프트 삭제 (프로젝트 관례)
                · contains_spoiler='Y' 인 감상평은 본문을 가리고,
                  사용자가 눌러서 펼치는 UI가 필요합니다
                · 감상평 작성은 "예매자만" 가능하도록 결정됨 → 서버에서 예매 이력 확인 필요
             ============================================================ */}
          <div className="reviewPlaceholder">
            <p className="reviewPlaceholderTitle">감상평 기능 준비 중</p>
            <p className="reviewPlaceholderDesc">
              공연 감상평(REV01)은 아직 개발 전입니다.
              <br />
              이 영역에 감상평 목록과 작성 폼이 들어갑니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
