// Client Component — "use client" 필요한 이유:
//   1. 환불 요청 버튼 onClick 이벤트 핸들러 (handleCancelPayment)
//   2. 로그인 세션 기반 사용자 정보 조회 (credentials: "include" 쿠키)
//   * 이상적으로는 유저 정보 + 결제 목록 fetch 를 Server Component 에서 처리하고
//     취소 버튼만 Client Component 로 분리하는 것이 좋지만,
//     세션 쿠키 forwarding 설정이 필요해 지금은 전체를 Client Component 로 유지
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Payment } from "@/lib/data/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import { getMyPayments, cancelPayment, deletePayment } from "@/lib/api/payments"

// 결제 상태 표시 라벨/Badge variant
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  DONE: "결제완료",
  CANCELED: "환불완료",
};
const PAYMENT_STATUS_VARIANT: Record<string, "open" | "closed"> = {
  DONE: "open",
  CANCELED: "closed",
};


export default function MyPage() {
  const router = useRouter();

  const { userSession } = useAuth();

  // 결제 내역 목록
  const [payments, setPayments] = useState<Payment[]>([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [cancellingPayment, setCancellingPayment] = useState<number | null>(null); // 취소(환불) 중인 paymentId
  const [deletingPayment, setDeletingPayment] = useState<number | null>(null); // 삭제 중인 paymentId

  useEffect(() => {
    getMyPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  // 결제 내역의 "환불 요청" 버튼 클릭 시 실행 — 토스 환불 + 좌석 반납까지 한 번에 처리됨
  const handleCancelPayment = async (paymentId: number) => {
    if (!confirm("결제를 취소하시겠습니까? 환불이 진행되고 좌석도 함께 취소됩니다.")) return;

    setCancellingPayment(paymentId);
    try {
      const canceled = await cancelPayment(paymentId);
      setPayments(prev =>
        prev.map(p => p.paymentId === paymentId ? canceled : p)
      );
    } catch (e: any) {
      alert(e?.message ?? "결제 취소에 실패했습니다.");
    } finally {
      setCancellingPayment(null);
    }
  };

  // 환불완료된 결제 내역 카드의 x 버튼 클릭 시 실행 — 목록에서만 숨김(실제 기록은 서버에 남음)
  const handleDeletePayment = async (paymentId: number) => {
    setDeletingPayment(paymentId);
    try {
      await deletePayment(paymentId);
      setPayments(prev => prev.filter(p => p.paymentId !== paymentId));
    } catch (e: any) {
      alert(e?.message ?? "삭제에 실패했습니다.");
    } finally {
      setDeletingPayment(null);
    }
  };

  return (
    <>
      <PageHeader title="마이페이지" subtitle="계정 정보와 결제 내역을 확인합니다.">
        <div className="mypageGrid">
          {/* 프로필 카드 */}
          <div className="profileCard">
            <div className="profileAvatar">
              {/* [TODO-MYPAGE-AVATAR] user.userNm 첫 글자 표시, 없으면 "?" */}
              {userSession?.userNm?.[0] ?? "?"}
            </div>
            <p className="profileName">{userSession?.userNm ?? "—"}</p>
            <p className="profileId">@{userSession?.userId ?? "—"}</p>

            <hr className="divider" />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ fontSize: "var(--font-md)", color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>결제 내역</span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{payments.length}건</span>
              </div>
              <div style={{ fontSize: "var(--font-md)", color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>결제완료</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  {payments.filter(p => p.payStatus === "DONE").length}건
                </span>
              </div>
            </div>
          </div>

          {/* 결제 내역 */}
          <div>
            <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
              결제 내역
            </h2>

            {loading && <StatusMessage variant="loading">불러오는 중...</StatusMessage>}

            {!loading && payments.length === 0 && (
              <div className="emptyMsg">
                <p style={{ fontSize: "var(--font-2xl)", marginBottom: "var(--space-3)" }}>🎫</p>
                <p>결제 내역이 없습니다.</p>
                <Button
                  variant="primary"
                  style={{ marginTop: "var(--space-4)" }}
                  onClick={() => router.push("/")}
                >
                  공연 보러 가기
                </Button>
              </div>
            )}

            <div className="reservationList">
              {payments.map(p => (
                <div key={p.paymentId} className="reservationCard">
                  <div className="reservationInfo">
                    <p className="reservationTitle">{p.pTitle}</p>
                    <div className="reservationMeta">
                      <span>📅 {new Date(p.roundTime).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>💺 {p.seatRow}행 {p.seatColume}번</span>
                      <span>🎟 {p.grade}</span>
                      <span>💳 {p.amount.toLocaleString("ko-KR")}원</span>
                      <span>🕒 {new Date(p.approvedAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} 승인</span>
                    </div>
                    <div style={{ marginTop: "var(--space-2)" }}>
                      <Badge variant={PAYMENT_STATUS_VARIANT[p.payStatus] ?? "closed"}>
                        {PAYMENT_STATUS_LABEL[p.payStatus] ?? p.payStatus}
                      </Badge>
                    </div>
                  </div>

                  {p.payStatus === "DONE" && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancelPayment(p.paymentId)}
                      disabled={cancellingPayment === p.paymentId}
                    >
                      {cancellingPayment === p.paymentId ? "처리 중..." : "환불 요청"}
                    </Button>
                  )}

                  {p.payStatus === "CANCELED" && (
                    <button
                      type="button"
                      className="cardCloseBtn"
                      title="목록에서 삭제"
                      onClick={() => handleDeletePayment(p.paymentId)}
                      disabled={deletingPayment === p.paymentId}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHeader>
    </>
  );
}
