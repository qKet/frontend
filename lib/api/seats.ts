import { apiFetch } from "./client";
import type { Seat } from "../data/types";

// GET /api/schedules/{roundId}/seats — SeatController.byRound()
// 특정 회차의 전체 좌석 목록 + 상태(AVAILABLE|LOCKED|RESERVED) 조회.
// queueToken 필수 — 백엔드가 로그인 여부와 대기열 통과 여부(canEnter)를 검증해서, 대기열을 안
// 거쳤거나 대기 자격(10분)이 만료됐으면 403을 준다. 호출부는 403을 "만료"로 해석해 안내 후 복귀시킬 것.
export async function getSeats(roundId: number, queueToken?: string): Promise<Seat[]> {
  const query = queueToken ? `?queueToken=${encodeURIComponent(queueToken)}` : "";
  return apiFetch<Seat[]>(`/schedules/${roundId}/seats${query}`);
}
