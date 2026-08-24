import { apiFetch } from "./client";
import type { Review, ReviewableRound } from "../data/types";

// ============================================================
// GET /api/events/{performanceId}/reviews
// 백엔드: ReviewController.java → list()
// 기능: 해당 공연의 감상평 목록 조회 (공개, 로그인 불필요)
//
// 사용 예시:
//   import { getReviews } from "@/lib/api/reviews";
//
//   useEffect(() => {
//     getReviews(performanceId).then(setReviews).finally(() => setLoading(false));
//   }, [performanceId]);
//
// 요청: 파라미터 없음
// 응답 JSON (Review[]):
//   [
//     { "reviewId": 1, "performanceId": 1, "userId": "testuser01", "userNm": "테스트유저01",
//       "content": "정말 좋았어요", "rating": 5, "containsSpoiler": "N", "insDe": "2026-08-04T12:00:00" }
//   ]
// ============================================================
export async function getReviews(performanceId: number): Promise<Review[]> {
  return apiFetch<Review[]>(`/events/${performanceId}/reviews`);
}

// ============================================================
// GET /api/events/{performanceId}/reviews/rounds
// 백엔드: ReviewController.java → reviewableRounds()  (로그인 필요)
// 기능: 감상평 작성 화면의 회차 선택 드롭다운용 — 내가 이 공연에서 예매한 회차 목록
//
// 사용 예시:
//   import { getReviewableRounds } from "@/lib/api/reviews";
//
//   const rounds = await getReviewableRounds(performanceId);
//   // 이미 감상평 쓴 회차는 reviews 목록에서 내 review들의 roundId와 대조해 프론트에서 제외
//
// 요청: 파라미터 없음
// 응답 JSON (ReviewableRound[]): [{ "roundId": 10, "roundTime": "2026-08-15T19:00:00" }]
// ============================================================
export async function getReviewableRounds(performanceId: number): Promise<ReviewableRound[]> {
  return apiFetch<ReviewableRound[]>(`/events/${performanceId}/reviews/rounds`);
}

// ============================================================
// POST /api/events/{performanceId}/reviews
// 백엔드: ReviewController.java → write()  (로그인 필요, 그 회차 예매자만 가능, 회차당 1개만)
// 기능: 감상평 작성. 스포일러 포함 여부는 사용자가 체크하지 않고 백엔드가 AI(AI01_SPOIL01)로
//      본문을 판별해서 응답의 containsSpoiler에 채워준다
//
// 사용 예시:
//   import { writeReview } from "@/lib/api/reviews";
//
//   try {
//     const review = await writeReview(performanceId, roundId, content, rating);
//     setReviews(prev => [review, ...prev]);
//   } catch (e: any) {
//     alert(e.message); // 예매 이력 없음(REV003), 이미 작성함(REV002) 등
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "roundId": 10, "content": "정말 좋았어요", "rating": 5 }
//
// 응답 JSON (Review): { "reviewId": 1, "performanceId": 1, "roundId": 10, "userId": "testuser01", "containsSpoiler": "N", ... }
// ============================================================
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

// ============================================================
// PUT /api/reviews/{reviewId}
// 백엔드: ReviewController.java → update()  (로그인 필요, 본인 감상평만)
// 기능: 감상평 수정. 스포일러 여부는 수정된 본문을 기준으로 AI가 다시 판별한다
//
// 사용 예시:
//   const updated = await updateReview(reviewId, content, rating);
//   setReviews(prev => prev.map(r => r.reviewId === reviewId ? updated : r));
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "content": "수정된 내용", "rating": 4 }
//
// 응답 JSON (Review)
// ============================================================
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

// ============================================================
// DELETE /api/reviews/{reviewId}
// 백엔드: ReviewController.java → delete()  (로그인 필요, 본인 감상평만, 소프트 삭제)
// 기능: 감상평 삭제
//
// 사용 예시:
//   if (confirm("감상평을 삭제하시겠습니까?")) {
//     await deleteReview(reviewId);
//     setReviews(prev => prev.filter(r => r.reviewId !== reviewId));
//   }
//
// 요청: 파라미터 없음
// 응답: 본문 없음 (성공 시 204/200)
// ============================================================
export async function deleteReview(reviewId: number): Promise<void> {
  await apiFetch<void>(`/reviews/${reviewId}`, { method: "DELETE" });
}
