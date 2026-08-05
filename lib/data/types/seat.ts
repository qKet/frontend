export type Seat = {
  reservationId: number;
  seatId: number;
  roundId: number;
  seatRow: string;
  seatColume: string;
  grade: "VIP" | "R" | "S";
  status: "AVAILABLE" | "LOCKED" | "RESERVED";
};
