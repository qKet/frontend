import { apiFetch } from "./client";

// GET /api/notifications/open-alerts/{roundId} — NotificationController.isSubscribed() (로그인 필요)
// 해당 회차 예매 오픈 알림 구독 여부(공연 상세페이지 버튼 초기 상태용).
export async function getOpenAlertStatus(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`);
}

// POST /api/notifications/open-alerts/{roundId} — NotificationController.subscribe() (로그인 필요)
// 구독 켜기 — open_time 30분 전에 이메일 발송.
export async function subscribeOpenAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`, { method: "POST" });
}

// DELETE /api/notifications/open-alerts/{roundId} — NotificationController.unsubscribe() (로그인 필요)
export async function unsubscribeOpenAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`, { method: "DELETE" });
}
