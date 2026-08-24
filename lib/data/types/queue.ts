export type QueueStatus = {
  queueToken: string;
  position: number;
  estimatedWait: number;
  status: "WAITING" | "ENTERED" | "EXPIRED";
  // 입장(ENTERED) 상태에서 좌석 선택에 남은 시간(초). 좌석 화면 카운트다운에 씀(2026-08-21).
  // WAITING/EXPIRED에서는 0.
  remainingSeconds: number;
};
