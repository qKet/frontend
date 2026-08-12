"use client";

// NOTI01_ALERT01(공연 취소표 알림) — 회차당 하나씩 노출되는 구독 토글 버튼.
// BookButton.tsx와 동일하게 로그인 안 된 상태에서 누르면 alert + /login 이동.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { getCancelAlertStatus, subscribeCancelAlert, unsubscribeCancelAlert } from "@/lib/api/notifications";

type Props = {
  roundId: number;
};

export default function CancelAlertToggle({ roundId }: Props) {
  const router = useRouter();
  const { userSession } = useAuth();

  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 로그인 상태에서만 현재 구독 여부를 물어봄 — 비로그인 상태로 호출하면 백엔드가 401을 주므로 그냥 꺼둔 채로 둠
  useEffect(() => {
    if (!userSession) {
      setSubscribed(false);
      return;
    }
    getCancelAlertStatus(roundId)
      .then(setSubscribed)
      .catch(() => setSubscribed(false));
  }, [roundId, userSession]);

  const handleToggle = async () => {
    if (!userSession) {
      alert("로그인 후 이용해주세요.");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const next = subscribed
        ? await unsubscribeCancelAlert(roundId)
        : await subscribeCancelAlert(roundId);
      setSubscribed(next);
    } catch {
      alert("취소표 알림 설정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={subscribed ? "secondary" : "ghost"} fullWidth disabled={loading} onClick={handleToggle}>
      {subscribed ? "🔔 취소표 알림 받는 중" : "🔕 취소표 알림 받기"}
    </Button>
  );
}
