import { apiFetch } from "./client";
import type { Payment } from "../data/types";

// POST /api/payments/confirm — PaymentController.confirm() (로그인 필요)
// 토스페이먼츠 결제 최종 승인 + 좌석 예매 확정. successUrl로 돌아온 paymentKey/orderId/amount와
// 좌석 선택 단계부터 들고 온 reservationId/roundId/seatId/queueToken을 합쳐서 보냄.
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

// GET /api/payments/my — PaymentController.myPayments() (로그인 필요)
// 내 결제 내역 조회(마이페이지, 최신순).
export async function getMyPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>("/payments/my");
}

// POST /api/payments/{paymentId}/cancel — PaymentController.cancelPayment() (본인 결제만 가능)
// 결제 취소(환불) — 토스 환불 처리 + 좌석 반납으로 다시 예매 가능해짐. 응답은 payStatus가
// "CANCELED"로 바뀐 Payment.
export async function cancelPayment(paymentId: number): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${paymentId}/cancel`, {
    method: "POST",
  });
}

// DELETE /api/payments/{paymentId} — PaymentController.deletePayment() (본인 결제만 가능)
// 결제 내역 목록에서 삭제 — 취소(환불)된 건만 가능. 실제 행은 안 지우고 숨김 처리(deleted_yn)라
// 회계 기록은 남고 화면에서만 안 보임.
export async function deletePayment(paymentId: number): Promise<void> {
  await apiFetch(`/payments/${paymentId}`, { method: "DELETE" });
}
