"use client";

// 예매 오픈 알림 — 회차별 버튼(BookButton 옆에 붙음). open_time 30분 전에 이메일로 알려줌.
// BookButton.tsx와 동일하게 로그인 안 된 상태에서 누르면 alert + /login 이동.
// 이미 오픈된 회차는 신청할 의미가 없어서 아예 렌더링 안 함.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { getOpenAlertStatus, subscribeOpenAlert, unsubscribeOpenAlert } from "@/lib/api/notifications";

type Props = {
  roundId: number;
  openTime: string;
};

export default function OpenAlertToggle({ roundId, openTime }: Props) {
  const router = useRouter();
  const { userSession } = useAuth();

  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ringing, setRinging] = useState(false); // 클릭 시 종 아이콘 흔들리는 연출(.bellRing, styles/detail.css) 트리거용
  const [beforeOpen, setBeforeOpen] = useState(() => new Date(openTime).getTime() > Date.now());

  // 로그인 상태에서만 현재 구독 여부를 물어봄 — 비로그인 상태로 호출하면 백엔드가 401을 주므로 그냥 꺼둔 채로 둠
  useEffect(() => {
    if (!userSession) {
      setSubscribed(false);
      return;
    }
    getOpenAlertStatus(roundId)
      .then(setSubscribed)
      .catch(() => setSubscribed(false));
  }, [roundId, userSession]);

  // BookButton.tsx와 동일한 패턴 — 1초마다 open_time을 다시 확인해서, 페이지를 계속 켜놓고 있어도
  // 오픈되는 순간 새로고침 없이 버튼이 알아서 사라지게 함
  useEffect(() => {
    const check = () => setBeforeOpen(new Date(openTime).getTime() > Date.now());
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [openTime]);

  // 이미 예매가 오픈된 회차는 알림 신청 의미가 없음
  if (!beforeOpen) return null;

  const handleClick = async () => {
    if (!userSession) {
      alert("로그인 후 이용해주세요.");
      router.push("/login");
      return;
    }
    setRinging(true);
    setLoading(true);
    try {
      const next = subscribed
        ? await unsubscribeOpenAlert(roundId)
        : await subscribeOpenAlert(roundId);
      setSubscribed(next);
    } catch {
      alert("예매 오픈 알림 설정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={subscribed ? "secondary" : "ghost"}
      className={subscribed ? "btnAlertSubscribed" : undefined}
      style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-base)" }}
      disabled={loading}
      onClick={handleClick}
      title="예매 오픈 30분 전 알림 신청"
    >
      <span className={ringing ? "bellRing" : ""} onAnimationEnd={() => setRinging(false)}>
        {subscribed ? "✓" : "🔕"}
      </span>{" "}
      {subscribed ? "신청 완료" : "오픈 알림"}
    </Button>
  );
}
