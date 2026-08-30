import { apiFetch } from "./client";
import type { Reservation, ApiResult } from "../data/types";

// POST /api/reservations — ReservationController.reserve() (로그인 필요)
// 좌석 예매 확정. reservationId는 좌석 선택 시 LOCKED로 걸어둔 예약 슬롯의 PK, queueToken은
// 대기열을 거쳐 들어온 경우만 값이 있음.
export async function createReservation(
    reservationId: number,
    roundId: number,
    seatId: number,
    queueToken?: string
): Promise<ApiResult> {
  return apiFetch<ApiResult>("/reservations", {
    method: "POST",
    body: { reservationId, roundId, seatId, queueToken },
  });
}

// GET /api/reservations/my — ReservationController.myReservations() (로그인 필요)
// 내 예매 내역(마이페이지). 백엔드가 { reservations: [...] }로 감싸서 줘서 여기서 배열만 꺼내 반환.
export async function getMyReservations(): Promise<Reservation[]> {
  const data = await apiFetch<{ reservations: Reservation[] }>("/reservations/my");
  return data.reservations ?? [];
}

// DELETE /api/reservations/{reservationId} — ReservationController.cancel()
// 예매 취소(로그인 필요, 본인 예약만 가능).
export async function cancelReservation(reservationId: number): Promise<ApiResult> {
  return apiFetch<ApiResult>(`/reservations/${reservationId}`, { method: "DELETE" });
}
