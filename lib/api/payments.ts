import { apiFetch } from "./client";
import type { Payment } from "../data/types";

// ============================================================
// POST /api/payments/confirm
// 백엔드: PaymentController.java → confirm()  (로그인 필요)
// 기능: 토스페이먼츠 결제 최종 승인 + 좌석 예매 확정
//
// successUrl 로 돌아온 paymentKey/orderId/amount 와, 좌석 선택 단계부터
// 쿼리스트링으로 들고 온 reservationId/roundId/seatId/queueToken 을 합쳐서 보냄
// ============================================================
export type PaymentConfirmParams = {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId: number;
  roundId: number;
  seatId: number;
  queueToken?: string;
};

export type PaymentConfirmResult = {
  paymentId: number;
  reservationId: number;
  userId: string;
  orderId: string;
  paymentKey: string;
  amount: number;
  payStatus: string;
  approvedAt: string;
};

export async function confirmPayment(
  params: PaymentConfirmParams
): Promise<PaymentConfirmResult> {
  return apiFetch<PaymentConfirmResult>("/payments/confirm", {
    method: "POST",
    body: params,
  });
}

// ============================================================
// GET /api/payments/my
// 백엔드: PaymentController.java → myPayments()  (로그인 필요)
// 기능: 내 결제 내역 조회 (마이페이지, 최신순)
//
// 사용 예시:
//   const payments = await getMyPayments();
//   setPayments(payments);
//
// 요청: 파라미터 없음
// 응답 JSON (Payment[]):
//   [
//     { "paymentId": 1, "reservationId": 225, "orderId": "QKET-...", "paymentKey": "...",
//       "amount": 220000, "payStatus": "DONE", "approvedAt": "2026-07-31 02:10:00",
//       "pTitle": "아이유 콘서트 - The Golden Hour", "roundTime": "2026-08-15 19:00:00",
//       "seatRow": "C", "seatColume": "47", "grade": "VIP" }
//   ]
// ============================================================
export async function getMyPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>("/payments/my");
}

// ============================================================
// POST /api/payments/{paymentId}/cancel
// 백엔드: PaymentController.java → cancelPayment()  (로그인 필요, 본인 결제만 취소 가능)
// 기능: 결제 취소(환불) 요청 — 토스에 환불 처리 + 좌석도 함께 반납되어 다시 예매 가능해짐
//
// 사용 예시:
//   if (confirm("결제를 취소하시겠습니까? 환불이 진행됩니다.")) {
//     const canceled = await cancelPayment(paymentId);
//     setPayments(prev => prev.map(p => p.paymentId === paymentId ? canceled : p));
//   }
//
// 요청: 파라미터 없음 (path의 paymentId만 사용)
// 응답 JSON (Payment, payStatus가 "CANCELED"로 바뀜)
// ============================================================
export async function cancelPayment(paymentId: number): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${paymentId}/cancel`, {
    method: "POST",
  });
}

// ============================================================
// DELETE /api/payments/{paymentId}
// 백엔드: PaymentController.java → deletePayment()  (로그인 필요, 본인 결제만 삭제 가능)
// 기능: 결제 내역 목록에서 삭제 — 취소(환불)된 건만 가능. 실제 행은 안 지우고 숨김 처리(deleted_yn)라
//      회계 기록은 그대로 남고, 사용자 화면에서만 다음 조회 때부터 안 보임
//
// 사용 예시:
//   await deletePayment(paymentId);
//   setPayments(prev => prev.filter(p => p.paymentId !== paymentId));
//
// 요청: 파라미터 없음 (path의 paymentId만 사용)
// 응답: 없음 (성공 시 204/200)
// ============================================================
export async function deletePayment(paymentId: number): Promise<void> {
  await apiFetch(`/payments/${paymentId}`, { method: "DELETE" });
}
