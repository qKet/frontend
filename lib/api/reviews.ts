import { apiFetch } from "./client";
import type { Review, ReviewableRound } from "../data/types";

// GET /api/events/{performanceId}/reviews — ReviewController.list() (공개, 로그인 불필요)
// 해당 공연의 감상평 목록 조회.
export async function getReviews(performanceId: number): Promise<Review[]> {
  return apiFetch<Review[]>(`/events/${performanceId}/reviews`);
}

// GET /api/events/{performanceId}/reviews/rounds — ReviewController.reviewableRounds() (로그인 필요)
// 감상평 작성 화면 회차 선택 드롭다운용 — 내가 이 공연에서 예매한 회차 목록.
export async function getReviewableRounds(performanceId: number): Promise<ReviewableRound[]> {
  return apiFetch<ReviewableRound[]>(`/events/${performanceId}/reviews/rounds`);
}

// POST /api/events/{performanceId}/reviews — ReviewController.write()
// 감상평 작성(로그인 필요, 그 회차 예매자만, 회차당 1개). 스포일러 여부는 사용자 체크 없이
// 백엔드가 AI로 본문을 판별해서 containsSpoiler에 채워줌.
export async function writeReview(
  performanceId: number,
  roundId: number,
  content: string,
  rating: number
): Promise<Review> {
  return apiFetch<Review>(`/events/${performanceId}/reviews`, {
    method: "POST",
    body: { roundId, content, rating },
  });
}

// PUT /api/reviews/{reviewId} — ReviewController.update() (로그인 필요, 본인 감상평만)
// 감상평 수정 — 스포일러 여부는 수정된 본문 기준으로 AI가 다시 판별.
export async function updateReview(
  reviewId: number,
  content: string,
  rating: number
): Promise<Review> {
  return apiFetch<Review>(`/reviews/${reviewId}`, {
    method: "PUT",
    body: { content, rating },
  });
}

// DELETE /api/reviews/{reviewId} — ReviewController.delete() (로그인 필요, 본인 감상평만, 소프트 삭제)
export async function deleteReview(reviewId: number): Promise<void> {
  await apiFetch<void>(`/reviews/${reviewId}`, { method: "DELETE" });
}
