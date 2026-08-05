// Client Component — "use client" 필요한 이유:
//   1. 대기열 상태 폴링 (setInterval, useRef)
//   2. 대기 순번 실시간 업데이트 (useState: status)
//   3. 입장 완료 시 페이지 이동 (useRouter)
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { QueueStatus } from "@/lib/data/types";
import { joinQueue, getQueueStatus, leaveQueue } from "@/lib/api/queues";
import StatusMessage from "@/components/ui/StatusMessage";

// 대기열 흐름 (기존 app/queue/page.tsx 로직을 팝업으로 이식):
//   1. 모달 오픈 → POST /api/queues 로 대기열 등록 → queueToken 받기
//   2. 3초마다 GET /api/queues/{queueToken} 폴링 → position, status 확인
//   3. status === "ENTERED" 이면 폴링 중단 → /seats/{scheduleId} 로 이동 (모달은 페이지 이동과 함께 사라짐)
//   4. status === "EXPIRED" 이면 폴링 중단 → 에러 메시지 표시

type Props = {
  scheduleId: number;
  title: string;
  location: string;
  posterUrl?: string;
  onClose: () => void;
};

export default function QueueModal({ scheduleId, title, location, posterUrl, onClose }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState("");
  // 조상(.eventCard:hover 등)에 transform이 걸리면 그 요소가 position:fixed 자식의
  // containing block이 되어버려 오버레이가 화면 전체가 아니라 카드 안에만 갇힘 →
  // document.body에 직접 포탈로 렌더링해서 그 문제를 우회한다. (SSR엔 document가 없어 마운트 후에만 렌더)
  const [mounted, setMounted] = useState(false);

  const tokenRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // [FIX-QUEUE-CANCEL] 언마운트 이후 도착하는 응답/타이머가 상태를 건드리지 못하게 막는 플래그
  const cancelledRef = useRef(false);

  const stopPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
  };

  const poll = async (token: string) => {
    try {
      const result = await getQueueStatus(token);
      if (cancelledRef.current) return;
      setStatus(result);

      if (result.status === "ENTERED") {
        stopPolling();
        redirectTimeoutRef.current = setTimeout(() => {
          if (cancelledRef.current) return;
          // push 대신 replace: 대기열 화면을 히스토리에 남기지 않아야
          // 좌석 선택 화면에서 "뒤로가기"를 눌러도 대기열로 돌아가서 자동 재입장되는 문제가 안 생김
          // pTitle/pLocation/posterUrl 은 여기서 API로 다시 조회하지 않고 그대로 실어 보냄 —
          // 좌석 화면과 결제 화면 모두 이 값들을 표시용으로만 쓰고 roundId로 이미 확정된 공연이라 재검증 불필요
          const forwardParams = new URLSearchParams({ queueToken: token, pTitle: title, pLocation: location });
          if (posterUrl) forwardParams.set("posterUrl", posterUrl);
          router.replace(`/seats/${scheduleId}?${forwardParams.toString()}`);
        }, 1500);
      } else if (result.status === "EXPIRED") {
        stopPolling();
        setError("대기열이 만료되었습니다.");
      }
    } catch (e: any) {
      if (cancelledRef.current) return;
      stopPolling();
      setError(e?.message ?? "서버에 연결할 수 없습니다.");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // 모달이 열리는 시점(마운트)에 대기열 등록 + 배경 스크롤 잠금
  useEffect(() => {
    cancelledRef.current = false;

    if (!scheduleId) {
      setError("잘못된 접근입니다.");
      return stopPolling;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    joinQueue(scheduleId)
      .then(({ queueToken }) => {
        if (cancelledRef.current) return;
        tokenRef.current = queueToken;
        poll(queueToken);
        intervalRef.current = setInterval(() => poll(queueToken), 3000);
      })
      .catch((e: any) => {
        if (cancelledRef.current) return;
        setError(e?.message ?? "대기열 등록에 실패했습니다.");
      });

    const handleBeforeUnload = () => {
      if (tokenRef.current) leaveQueue(tokenRef.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelledRef.current = true;
      stopPolling();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [scheduleId]);

  // 닫기(X): 입장 완료 후에는 어차피 페이지 이동으로 사라지므로 확인 없이 닫고,
  // 대기 중일 때는 대기열 이탈이 확정되는 행동이라 확인을 한 번 받는다.
  const handleClose = () => {
    if (status?.status !== "ENTERED" && tokenRef.current) {
      const ok = window.confirm("대기열에서 나가시겠습니까? 대기 순번이 사라집니다.");
      if (!ok) return;
      leaveQueue(tokenRef.current);
    }
    cancelledRef.current = true;
    stopPolling();
    onClose();
  };

  const formatWait = (seconds: number) => {
    if (seconds < 60) return `약 ${seconds}초`;
    return `약 ${Math.ceil(seconds / 60)}분`;
  };

  if (!mounted) return null;

  return createPortal(
    <div className="queueModalOverlay">
      <div className="queueModal">
        <button className="queueModalClose" onClick={handleClose} aria-label="닫기">✕</button>

        <div className="queueIcon">🎫</div>
        <h1 className="queueTitle">대기열</h1>
        <p className="queueEventName">{title}</p>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {/* 대기열 진입 중 (status 아직 없음) */}
        {!error && !status && (
          <>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
            <p style={{ fontSize: "var(--font-md)", color: "var(--text-2)" }}>대기열에 진입하는 중...</p>
          </>
        )}

        {/* 대기 중 */}
        {status?.status === "WAITING" && (
          <>
            <div className="queuePosition">{status.position.toLocaleString()}</div>
            <p className="queuePositionLabel">내 앞 대기 인원</p>
            <p className="queueWait">
              예상 대기시간 <strong>{formatWait(status.estimatedWait)}</strong>
            </p>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
            <p className="queueNote">창을 닫지 마세요. 순번이 되면 자동으로 이동합니다.</p>
          </>
        )}

        {/* 입장 완료 */}
        {status?.status === "ENTERED" && (
          <>
            <div className="queueEntered">✅ 입장 가능합니다! 좌석 선택 페이지로 이동합니다...</div>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
