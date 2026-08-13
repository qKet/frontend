import { apiFetch } from "./client";

// ============================================================
// GET /api/notifications/open-alerts/{roundId}
// 백엔드: NotificationController.java → isSubscribed()  (로그인 필요)
// 기능: 로그인 사용자가 해당 회차 예매 오픈 알림을 구독 중인지 조회 (공연 상세페이지 회차별 버튼 초기 상태용)
//
// 사용 예시:
//   useEffect(() => {
//     getOpenAlertStatus(roundId).then(setSubscribed);
//   }, [roundId]);
//
// 요청: path 파라미터 roundId
// 응답: true | false (GlobalResponseAdvice가 감싼 data를 apiFetch가 꺼내서 boolean 그대로 반환)
// ============================================================
export async function getOpenAlertStatus(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`);
}

// ============================================================
// POST /api/notifications/open-alerts/{roundId}
// 백엔드: NotificationController.java → subscribe()  (로그인 필요)
// 기능: 해당 회차 예매 오픈 알림 구독 켜기 (open_time 30분 전에 이메일 발송)
//
// 사용 예시:
//   await subscribeOpenAlert(roundId);
//   setSubscribed(true);
//
// 요청: path 파라미터 roundId, body 없음
// 응답: true
// ============================================================
export async function subscribeOpenAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`, { method: "POST" });
}

// ============================================================
// DELETE /api/notifications/open-alerts/{roundId}
// 백엔드: NotificationController.java → unsubscribe()  (로그인 필요)
// 기능: 해당 회차 예매 오픈 알림 구독 끄기
//
// 사용 예시:
//   await unsubscribeOpenAlert(roundId);
//   setSubscribed(false);
//
// 요청: path 파라미터 roundId, body 없음
// 응답: false
// ============================================================
export async function unsubscribeOpenAlert(roundId: number): Promise<boolean> {
  return apiFetch<boolean>(`/notifications/open-alerts/${roundId}`, { method: "DELETE" });
}
