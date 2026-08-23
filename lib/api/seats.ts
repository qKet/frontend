import { apiFetch } from "./client";
import type { Seat } from "../data/types";

// ============================================================
// GET /api/schedules/{roundId}/seats
// 백엔드: SeatController.java → byRound()
// 기능: 특정 회차의 전체 좌석 목록 + 상태 조회 (좌석 선택 화면에서 좌석맵 그릴 때 사용)
//
// 사용 예시:
//   import { getSeats } from "@/lib/api/seats";
//
//   useEffect(() => {
//     getSeats(roundId).then(setSeats);
//   }, [roundId]);
//
// 응답 JSON (Seat[]):
//   [
//     { "reservationId": 501, "seatId": 88, "roundId": 10, "seatRow": "A", "seatColume": "12",
//       "grade": "VIP", "status": "AVAILABLE" }
//   ]
//   status 는 "AVAILABLE" | "LOCKED" | "RESERVED" 중 하나
//
// 2026-08-21: queueToken이 필수가 됨. 백엔드(SeatController)가 로그인 여부와 대기열 통과 여부
// (QueueService.canEnter)를 검증하도록 바뀌었기 때문 — 대기열을 안 거치고 /seats/{roundId}로
// 직접 들어오면 403을 받는다. 대기 자격(10분)이 만료된 뒤에도 마찬가지로 403이므로,
// 호출부는 403을 "만료"로 해석해서 안내 후 공연 상세로 돌려보내야 함.
// ============================================================
export async function getSeats(roundId: number, queueToken?: string): Promise<Seat[]> {
  const query = queueToken ? `?queueToken=${encodeURIComponent(queueToken)}` : "";
  return apiFetch<Seat[]>(`/schedules/${roundId}/seats${query}`);
}
