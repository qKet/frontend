"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ANONYMOUS,
  loadTossPayments,
} from "@tosspayments/tosspayments-sdk";

const GRADE_PRICE: Record<string, number> = {
  VIP: 220000,
  R: 154000,
  S: 99000,
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initializedRef = useRef(false);
  const widgetsRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reservationId = searchParams.get("reservationId");
  const roundId = searchParams.get("roundId");
  const seatId = searchParams.get("seatId");
  const seatRow = searchParams.get("seatRow");
  const seatColume = searchParams.get("seatColume");
  const grade = searchParams.get("grade") ?? "";
  const amount = GRADE_PRICE[grade] ?? 0;

  // 좌석 선택 화면까지 QueueModal → seats page를 거쳐 그대로 실려온 공연 정보.
  // 직접 URL을 조작해 들어오는 등 없는 경우도 있으니 있으면만 보여준다 (필수 값 아님 — isValid 판정엔 안 씀)
  const pTitle = searchParams.get("pTitle") ?? "";
  const pLocation = searchParams.get("pLocation") ?? "";
  const posterUrl = searchParams.get("posterUrl") ?? "";

  const isValid = Boolean(
    reservationId &&
    roundId &&
    seatId &&
    seatRow &&
    seatColume &&
    grade &&
    amount > 0
  );

  useEffect(() => {
    if (!isValid || initializedRef.current) return;

    const clientKey =
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setError("토스 테스트 클라이언트 키가 없습니다.");
      return;
    }

    initializedRef.current = true;

    const initializeWidget = async () => {
      const tossPayments =
        await loadTossPayments(clientKey);

      const widgets = tossPayments.widgets({
        customerKey: ANONYMOUS,
      });

      await widgets.setAmount({
        currency: "KRW",
        value: amount,
      });

      await Promise.all([
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      widgetsRef.current = widgets;
      setReady(true);
    };

    initializeWidget().catch((widgetError) => {
      console.error(widgetError);
      initializedRef.current = false;
      setError("결제위젯을 불러오지 못했습니다.");
    });
  }, [amount, isValid]);

  const GRADE_LABEL: Record<string, string> = {
    VIP: "VIP석",
    R: "R석",
    S: "S석",
  };

  if (!isValid) {
    return (
      <div className="pageWrap">
        <h1 className="pageTitle">
          잘못된 접근입니다.
        </h1>

        <button
          className="btnPrimary"
          onClick={() => router.back()}
        >
          좌석 선택으로 돌아가기
        </button>
      </div>
    );
  }

  const handlePayment = async () => {
  if (!ready || !widgetsRef.current) return;

  // successUrl/failUrl 은 토스가 paymentKey/orderId/amount(또는 code/message)를 쿼리스트링으로
  // 덧붙여 리다이렉트하는 주소. 우리가 미리 붙여둔 파라미터는 그대로 유지된 채 넘어가므로,
  // 지금 이 화면이 받은 예약 식별자를 그대로 실어보냄 — success 페이지는 confirm API 호출에,
  // fail 페이지는 "다시 시도" 시 체크아웃 화면을 다시 여는 데 씀
  const forwardParams = searchParams.toString();

  try {
    await widgetsRef.current.requestPayment({
      orderId: `QKET-${crypto.randomUUID()}`,
      orderName: `Qket ${grade}석 예매`,
      successUrl: `${window.location.origin}/payments/success?${forwardParams}`,
      failUrl: `${window.location.origin}/payments/fail?${forwardParams}`,
    });
  } catch (error) {
    console.error("결제 요청 실패:", error);
  }
};

  // 레이아웃 의도는 styles/checkout.css 상단 주석 참고
  // (요약은 우리 다크 테마, 결제는 토스 위젯에 맞춘 라이트 테마로 면을 분리)
  return (
    <div className="checkoutWrap">
      <div className="checkoutTopBar">
        <span className="checkoutBrand">Q-Ket</span>

        <button
          type="button"
          className="checkoutBack"
          onClick={() => router.back()}
        >
          ← 좌석 선택으로
        </button>
      </div>

      <div className="checkoutPanel">
        {/* 왼쪽 — 예매 요약 (다크) */}
        <div className="checkoutSummary">
          <p className="checkoutSummaryTitle">
            예매 정보
          </p>

          {(pTitle || posterUrl) && (
            <div className="checkoutEventCard">
              <div className="checkoutPoster">
                {posterUrl
                  ? <img src={posterUrl} alt={pTitle} />
                  : <div className="checkoutPosterEmpty" />}
              </div>

              <div className="checkoutEventInfo">
                {pTitle && <p className="checkoutEventTitle">{pTitle}</p>}
                {pLocation && <p className="checkoutEventLocation">{pLocation}</p>}
              </div>
            </div>
          )}

          <div className="checkoutSummaryRow">
            <span className="checkoutSummaryLabel">
              좌석
            </span>

            <span className="checkoutSummaryValue checkoutSeatValue">
              {seatRow}{seatColume}
            </span>
          </div>

          <div className="checkoutSummaryRow">
            <span className="checkoutSummaryLabel">
              등급
            </span>

            <span className="checkoutSummaryValue">
              {GRADE_LABEL[grade] ?? grade}
            </span>
          </div>

          <hr className="checkoutSummaryDivider" />

          <div className="checkoutSummaryRow">
            <span className="checkoutSummaryLabel">
              예매번호
            </span>

            <span className="checkoutSummaryValue">
              {reservationId}
            </span>
          </div>

          <div className="checkoutTotal">
            <p className="checkoutTotalLabel">
              총 결제금액
            </p>

            <p className="checkoutTotalValue">
              {amount.toLocaleString("ko-KR")}
              <span className="checkoutTotalUnit">원</span>
            </p>
          </div>
        </div>

        {/* 오른쪽 — 결제 (라이트, 토스 위젯 영역) */}
        <div className="checkoutPayment">
          <p className="checkoutPaymentTitle">
            결제 수단
          </p>

          <p className="checkoutPaymentSubtitle">
            원하시는 결제 방법을 선택해주세요.
          </p>

          {error && (
            <p className="checkoutErrorMsg">{error}</p>
          )}

          <div className="checkoutWidgetSlot">
            <div id="payment-method" />
            <div id="agreement" />
          </div>

          <div className="checkoutPayAction">
            <button
              type="button"
              className="checkoutPayBtn"
              disabled={!ready}
              onClick={handlePayment}
            >
              {ready
                ? `${amount.toLocaleString("ko-KR")}원 결제하기`
                : "결제위젯 불러오는 중..."}
            </button>

            <p className="checkoutSecureNote">
              토스페이먼츠를 통해 안전하게 결제됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <p className="loadingMsg">
          불러오는 중...
        </p>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}