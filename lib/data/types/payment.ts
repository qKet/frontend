export type Payment = {
  paymentId: number;
  reservationId: number;
  orderId: string;
  paymentKey: string;
  amount: number;
  payStatus: string;
  approvedAt: string;
  pTitle: string;
  roundTime: string;
  seatRow: string;
  seatColume: string;
  grade: string;
};
