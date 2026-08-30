import { apiFetch } from "../client";
import type { ReservationHistoryLog } from "@/lib/data/types";

export type ReservationHistoryFilter = {
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
  userId?: string;
  action?: "RESERVED" | "CANCELLED";
};

// GET /api/admin/reservations/history — AdminReservationController.getHistory() (관리자만, 아니면 403)
// 예매 활동 로그 조회 — 기간(필수)/사용자·액션(선택)으로 필터링.
export function getReservationHistory(filter: ReservationHistoryFilter): Promise<ReservationHistoryLog[]> {
  const params = new URLSearchParams({ from: filter.from, to: filter.to });
  if (filter.userId) params.set("userId", filter.userId);
  if (filter.action) params.set("action", filter.action);
  return apiFetch<ReservationHistoryLog[]>(`/admin/reservations/history?${params.toString()}`);
}
