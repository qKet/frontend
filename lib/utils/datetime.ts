// 백엔드 DATETIME 문자열("2026-08-20 19:30:00")을 화면용 문자열로 바꾸는 헬퍼.
//
// ⚠️ Date/toLocaleString 을 쓰지 않고 문자열을 직접 파싱하는 이유:
//    서버(Node, ICU 데이터 제한)와 브라우저(완전한 ICU)에서 "AM"/"오전"처럼 결과가 달라져
//    하이드레이션 에러가 났던 적이 있음 (components/BookButton.tsx 주석 참고).
//    요일도 실행 환경 타임존에 따라 갈릴 수 있어 Date.UTC 로 고정한다.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type ParsedDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

export function parseDateTime(value: string): ParsedDateTime {
  const [datePart, timePart = "00:00:00"] = value.replace("T", " ").split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  // Date.UTC 로 만들면 실행 환경 타임존과 무관하게 항상 같은 요일이 나옴
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, hour, minute, weekday };
}

// "2026. 8. 20. (목) 오후 7:30"
export function formatRoundTime(value: string): string {
  const { year, month, day, hour, minute, weekday } = parseDateTime(value);
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${year}. ${month}. ${day}. (${weekday}) ${period} ${hour12}:${String(minute).padStart(2, "0")}`;
}

// "8. 20. (목)"
export function formatDateShort(value: string): string {
  const { month, day, weekday } = parseDateTime(value);
  return `${month}. ${day}. (${weekday})`;
}
