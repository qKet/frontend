export type QueueStatus = {
  queueToken: string;
  position: number;
  estimatedWait: number;
  status: "WAITING" | "ENTERED" | "EXPIRED";
};
