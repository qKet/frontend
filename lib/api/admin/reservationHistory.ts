import { apiFetch } from "../client";
import type { ReservationHistoryLog } from "@/lib/data/types";

export type ReservationHistoryFilter = {
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
  userId?: string;
  action?: "RESERVED" | "CANCELLED";
};

// ============================================================
// GET /api/admin/reservations/history
// 백엔드: AdminReservationController.java → getHistory()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 예매 활동 로그 조회 — RESERVATION_HISTORY를 기간(필수)/사용자·액션(선택)으로 필터링
//
// 사용 예시:
//   import { getReservationHistory } from "@/lib/api/admin";
//   const logs = await getReservationHistory({ from: "2026-08-01", to: "2026-08-10" });
//
// 요청: 쿼리스트링 — from/to는 필수(YYYY-MM-DD), userId/action은 선택
// 응답 JSON (ReservationHistoryLog[]):
//   [{ "historyId": 1, "userId": "testuser01", "seatId": 88, "roundId": 10,
//      "reservedStatus": "RESERVED", "createdReserved": "2026-08-10 14:00:00", "insIp": "127.0.0.1",
//      "seatRow": "A", "seatColume": "12", "grade": "VIP",
//      "pTitle": "뮤지컬 지킬앤하이드", "roundTime": "2026-08-15 19:00:00" }]
// ============================================================
export function getReservationHistory(filter: ReservationHistoryFilter): Promise<ReservationHistoryLog[]> {
  const params = new URLSearchParams({ from: filter.from, to: filter.to });
  if (filter.userId) params.set("userId", filter.userId);
  if (filter.action) params.set("action", filter.action);
  return apiFetch<ReservationHistoryLog[]>(`/admin/reservations/history?${params.toString()}`);
}
