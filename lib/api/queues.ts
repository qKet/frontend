import { apiFetch } from "./client";
import type { QueueStatus } from "../data/types";

// POST /api/queues — QueueController.join() (로그인 필요)
// 특정 회차(scheduleId) 대기열 참가 신청 → { queueToken }.
export async function joinQueue(scheduleId: number): Promise<{ queueToken: string }> {
  return apiFetch<{ queueToken: string }>("/queues", {
    method: "POST",
    body: { scheduleId },
  });
}

// GET /api/queues/{queueToken} — QueueController.getStatus()
// 대기 순번/예상 대기시간 조회 — 대기 화면에서 폴링용. status: WAITING|ENTERED|EXPIRED.
export async function getQueueStatus(queueToken: string): Promise<QueueStatus> {
  return apiFetch<QueueStatus>(`/queues/${queueToken}`);
}

// POST /api/queues/{queueToken}/leave — QueueController.leave()
// 대기열 이탈 처리(자리 반납). navigator.sendBeacon 사용 — 페이지 unload 중에도 fetch와 달리
// 브라우저가 백그라운드로 끝까지 보내줌(POST만 지원해서 DELETE 대신 /leave 엔드포인트로 만듦).
export async function leaveQueue(queueToken: string): Promise<void> {
  navigator.sendBeacon(`/api/queues/${queueToken}/leave`);
}
