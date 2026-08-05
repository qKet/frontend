import { apiFetch } from "./client";
import type { QueueStatus } from "../data/types";

// ============================================================
// POST /api/queues
// 백엔드: QueueController.java → join()  (요청/응답 DTO: QueueJoinRequest / QueueJoinResponse)
// 기능: 특정 회차의 대기열에 참가 신청 (로그인 필요 — 세션에서 유저 확인)
//
// 사용 예시:
//   import { joinQueue } from "@/lib/api/queues";
//
//   const { queueToken } = await joinQueue(roundId);
//   router.push(`/queue?token=${queueToken}`);
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "scheduleId": 10 }   // scheduleId = 회차(round) PK
//
// 응답 JSON:
//   { "queueToken": "a1b2c3d4-..." }
// ============================================================
export async function joinQueue(scheduleId: number): Promise<{ queueToken: string }> {
  return apiFetch<{ queueToken: string }>("/queues", {
    method: "POST",
    body: { scheduleId },
  });
}

// ============================================================
// GET /api/queues/{queueToken}
// 백엔드: QueueController.java → getStatus()  (응답 DTO: QueueStatusResponse)
// 기능: 대기 순번/예상 대기시간 조회 — 대기 화면에서 몇 초 간격으로 계속 호출(polling)해서 씀
//
// 사용 예시:
//   const interval = setInterval(async () => {
//     const status = await getQueueStatus(queueToken);
//     setQueueStatus(status);
//     if (status.status === "ENTERED") { clearInterval(interval); router.push("/seats"); }
//   }, 2000);
//
// 응답 JSON:
//   { "queueToken": "a1b2c3d4-...", "status": "WAITING", "position": 42, "estimatedWait": 120 }
//   status 는 "WAITING" | "ENTERED" | "EXPIRED" 중 하나
// ============================================================
export async function getQueueStatus(queueToken: string): Promise<QueueStatus> {
  return apiFetch<QueueStatus>(`/queues/${queueToken}`);
}

// ============================================================
// POST /api/queues/{queueToken}/leave
// 백엔드: QueueController.java → leave()
// 기능: 대기열에서 이탈 처리 (대기 화면을 벗어날 때 서버에 알려서 자리를 비워줌)
//
// 사용 예시 (페이지 unload 시):
//   useEffect(() => {
//     const handleUnload = () => leaveQueue(queueToken);
//     window.addEventListener("beforeunload", handleUnload);
//     return () => window.removeEventListener("beforeunload", handleUnload);
//   }, [queueToken]);
//
// navigator.sendBeacon 을 쓰는 이유: 페이지가 닫히는 순간엔 일반 fetch는 응답을 기다리다 취소될 수
// 있는데, sendBeacon 은 브라우저가 별도로 백그라운드에서 요청을 끝까지 보내주기 때문
// (백엔드가 DELETE 대신 POST + /leave 로 만든 것도 sendBeacon 이 POST만 지원해서임)
// ============================================================
export async function leaveQueue(queueToken: string): Promise<void> {
  navigator.sendBeacon(`/api/queues/${queueToken}/leave`);
}
