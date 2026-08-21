// 등급별 좌석 가격/라벨 — 프론트 표시용 단일 source.
//
// 주의: 이 값은 오직 "화면에 뭐라고 보여줄지"에만 쓰임. 실제 결제 금액은 백엔드
// PaymentServiceImpl의 GRADE_PRICE가 최종 기준이고, 결제 승인 시 서버가 좌석 등급을 보고
// 직접 재계산해서 클라이언트가 보낸 금액과 대조하기 때문에, 여기 값을 조작해도 실제 결제 금액은
// 안 바뀜(가격 신뢰의 주체는 항상 백엔드). 다만 두 값이 어긋나면 사용자가 화면에서 본 금액과
// 실제 결제창 금액이 달라 보이는 UX 문제가 생기니, 등급별 가격을 바꿀 땐 백엔드 GRADE_PRICE와
// 이 파일을 반드시 같이 수정할 것.
export const GRADE_PRICE: Record<string, number> = {
  VIP: 220000,
  R: 154000,
  S: 99000,
};

export const GRADE_LABEL: Record<string, string> = {
  VIP: "VIP석",
  R: "R석",
  S: "S석",
};
