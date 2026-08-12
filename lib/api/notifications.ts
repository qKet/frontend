import { apiFetch } from "./client";

// ============================================================
// GET /api/notifications/cancel-alerts/{roundId}
// 백엔드: NotificationController.java → isSubscribed()  (로그인 필요)
// 기능: 로그인 사용자가 해당 회차 취소표 알림을 구독 중인지 조회 (좌석 페이지 진입 시 버튼 초기 상태용)
//
// 사용 예시:
//   useEffect(() => {
//     getCancelAlertStatus(roundId).then(setSubscribed);
//   }, [roundId]);
//
// 요청: path 파라미터 roundId
// 응답: true | false (GlobalResponseAdvice가 감싼 data를 apiFetch가 꺼내서 boolean 그대로 반환)
// ============================================================
export async function getCancelAlertStatus(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/cancel-alerts/${roundId}`);
}

// ============================================================
// POST /api/notifications/cancel-alerts/{roundId}
// 백엔드: NotificationController.java → subscribe()  (로그인 필요)
// 기능: 해당 회차 취소표 알림 구독 켜기
//
// 사용 예시:
//   await subscribeCancelAlert(roundId);
//   setSubscribed(true);
//
// 요청: path 파라미터 roundId, body 없음
// 응답: true
// ============================================================
export async function subscribeCancelAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/cancel-alerts/${roundId}`, { method: "POST" });
}

// ============================================================
// DELETE /api/notifications/cancel-alerts/{roundId}
// 백엔드: NotificationController.java → unsubscribe()  (로그인 필요)
// 기능: 해당 회차 취소표 알림 구독 끄기
//
// 사용 예시:
//   await unsubscribeCancelAlert(roundId);
//   setSubscribed(false);
//
// 요청: path 파라미터 roundId, body 없음
// 응답: false
// ============================================================
export async function unsubscribeCancelAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/cancel-alerts/${roundId}`, { method: "DELETE" });
}
