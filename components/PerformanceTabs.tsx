"use client";

// 공연 상세 화면의 "출연진 / 감상평" 탭.
// 페이지(app/events/[performanceId]/page.tsx)는 Server Component 로 두고,
// 탭 전환 상태(useState)가 필요한 이 부분만 Client Component 로 분리했다.
// (BookButton 과 같은 패턴 — 서버 렌더링을 유지하면서 인터랙션만 클라이언트로 뺌)

import { useState } from "react";
import type { PerformanceCast } from "@/lib/data/types";
import ReviewSection from "@/components/ReviewSection";

// 회차별 캐스팅 묶음. roundLabel 은 서버에서 formatRoundTime 으로 미리 만들어서 넘긴다
// (날짜 포맷 로직을 서버/클라이언트 양쪽에 두지 않기 위함)
export type RoundCastGroup = {
  roundId: number;
  roundLabel: string;
  casts: PerformanceCast[];
};

type Props = {
  performanceId: number;
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

export default function PerformanceTabs({ performanceId, commonCasts, roundCasts }: Props) {
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
          <ReviewSection performanceId={performanceId} />
        </div>
      )}
    </section>
  );
}
