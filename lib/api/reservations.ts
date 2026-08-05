import { apiFetch } from "./client";
import type { Reservation, ApiResult } from "../data/types";

// ============================================================
// POST /api/reservations
// 백엔드: ReservationController.java → reserve()  (로그인 필요)
// 기능: 좌석 예매 확정
//
// 사용 예시:
//   import { createReservation } from "@/lib/api/reservations";
//
//   try {
//     await createReservation(reservationId, roundId, seatId, queueToken);
//     router.push("/mypage");
//   } catch (e: any) {
//     setError(e.message);
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "reservationId": 501, "roundId": 10, "seatId": 88, "queueToken": "a1b2c3d4-..." }
//   - reservationId: 좌석 선택 시 이미 LOCKED 상태로 걸어둔 예약 슬롯의 PK
//   - queueToken: 대기열을 거쳐 들어온 경우만 값이 있고, 아니면 undefined로 보냄
//
// 응답 JSON: { "success": true } 또는 실패 시 { "success": false, "message": "..." }
// ============================================================
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

// ============================================================
// GET /api/reservations/my
// 백엔드: ReservationController.java → myReservations()  (로그인 필요)
// 기능: 내 예매 내역 조회 (마이페이지에서 사용)
//
// 사용 예시:
//   const list = await getMyReservations();
//   setReservations(list);
//
// 응답 JSON (백엔드는 { reservations: [...] } 형태로 감싸서 주기 때문에,
//            이 함수 안에서 배열만 꺼내서 반환함 — 호출하는 쪽은 바로 배열을 받음):
//   { "success": true, "reservations": [
//       { "historyId": 1, "reservationId": 501, "pTitle": "뮤지컬 지킬앤하이드",
//         "roundTime": "2026-08-15 19:00:00", "seatRow": "A", "seatColume": "12",
//         "grade": "VIP", "reservedStatus": "CONFIRMED", "createdReserved": "2026-07-20 10:00:00" }
//   ] }
// ============================================================
export async function getMyReservations(): Promise<Reservation[]> {
  const data = await apiFetch<{ reservations: Reservation[] }>("/reservations/my");
  return data.reservations ?? [];
}

// ============================================================
// DELETE /api/reservations/{reservationId}
// 백엔드: ReservationController.java → cancel()  (로그인 필요, 본인 예약만 취소 가능)
// 기능: 예매 취소
//
// 사용 예시:
//   if (confirm("예매를 취소하시겠습니까?")) {
//     await cancelReservation(reservationId);
//     setReservations(prev => prev.filter(r => r.reservationId !== reservationId));
//   }
//
// 응답 JSON: { "success": true }
// ============================================================
export async function cancelReservation(reservationId: number): Promise<ApiResult> {
  return apiFetch<ApiResult>(`/reservations/${reservationId}`, { method: "DELETE" });
}
