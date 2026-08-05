"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // React StrictMode/리렌더로 confirm이 두 번 나가는 것을 막기 위한 가드
  const requestedRef = useRef(false);

  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");
  const [error, setError] = useState("");

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const reservationId = searchParams.get("reservationId");
  const roundId = searchParams.get("roundId");
  const seatId = searchParams.get("seatId");
  const queueToken = searchParams.get("queueToken") ?? undefined;

  useEffect(() => {
    if (requestedRef.current) return;

    if (!paymentKey || !orderId || !amount || !reservationId || !roundId || !seatId) {
      setStatus("error");
      setError("잘못된 접근입니다.");
      return;
    }

    requestedRef.current = true;

    confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
      reservationId: Number(reservationId),
      roundId: Number(roundId),
      seatId: Number(seatId),
      queueToken,
    })
      .then(() => {
        setStatus("done");
        setTimeout(() => router.replace("/mypage"), 2000);
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError(e instanceof ApiError ? e.message : "결제 승인에 실패했습니다.");
      });
  }, [paymentKey, orderId, amount, reservationId, roundId, seatId, queueToken, router]);

  return (
    <div className="pageWrap">
      <h1 className="pageTitle">결제 승인</h1>

      <p>주문번호: {orderId}</p>
      <p>결제금액: {Number(amount ?? 0).toLocaleString("ko-KR")}원</p>

      {status === "confirming" && (
        <p className="loadingMsg">결제 승인 처리 중입니다...</p>
      )}
      {status === "done" && (
        <p className="successMsg">결제 및 예매가 완료되었습니다. 마이페이지로 이동합니다.</p>
      )}
      {status === "error" && <p className="errorMsg">{error}</p>}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p className="loadingMsg">불러오는 중...</p>}>
      <SuccessContent />
    </Suspense>
  );
}
