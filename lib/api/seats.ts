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
// ============================================================
export async function getSeats(roundId: number): Promise<Seat[]> {
  return apiFetch<Seat[]>(`/schedules/${roundId}/seats`);
}
