export type Review = {
  reviewId: number;
  performanceId: number;
  roundId: number;
  userId: string;
  userNm: string;
  content: string;
  rating: number;
  containsSpoiler: "Y" | "N";
  insDe: string;
  roundTime: string;
};

// 감상평 작성 화면의 회차 선택 드롭다운용 — 사용자가 예매한 회차 하나
export type ReviewableRound = {
  roundId: number;
  roundTime: string;
};
