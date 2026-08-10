export type AdminUser = {
  userId: string;
  userNm: string;
  userEmail: string;
  userStatus: string;
  roleId: number;
  roleName: string;
  // 최종 수정자/수정일시 — 한 번도 수정 안 됐으면 둘 다 null
  uptId: string | null;
  uptDe: string | null;
};

export type Role = {
  roleId: number;
  roleName: string;
};

export type Venue = {
  venueId: number;
  venueName: string;
};

// 프로그램관리 — 등록된 화면(라우트) 한 건. programType: 'MENU'(네비게이션 노출) / 'PAGE'(URL 접근만)
export type Program = {
  programId: number;
  programNm: string;
  urlPath: string;
  programType: "MENU" | "PAGE";
  useYn: "Y" | "N";
  uptId: string | null;
  uptDe: string | null;
};

// 권한 확장 — 역할 × 프로그램 접근권한 매핑 한 칸 (권한 그리드의 체크박스 하나)
export type RoleProgram = {
  roleId: number;
  programId: number;
};

// 메뉴관리 — 그리드에서 관리하는 메뉴 한 행 (programNm/urlPath는 화면 표시용으로 조인되어 내려옴)
// programId가 null이면 "그룹 전용" 메뉴 — 연결된 페이지 없이 하위메뉴만 묶는 드롭다운 헤더 (예: "관리자")
export type Menu = {
  menuId: number;
  programId: number | null;
  programNm: string | null;
  urlPath: string | null;
  parentMenuId: number | null;
  menuNm: string;
  sortOrder: number;
  useYn: "Y" | "N";
  uptId: string | null;
  uptDe: string | null;
};

// 로그인 사용자가 접근 가능한 메뉴 트리 (SiteNav 렌더링용, GET /common/menus/my 응답)
// urlPath가 null이면 그룹 전용 메뉴 — SiteNav에서 링크가 아니라 호버 트리거로만 렌더링해야 함
export type MenuTreeNode = {
  menuId: number;
  menuNm: string;
  urlPath: string | null;
  sortOrder: number;
  parentMenuId: number | null;
  children: MenuTreeNode[];
};

// 예매 활동 로그(보고서) — RESERVATION_HISTORY 한 행. 일반 사용자용 Reservation과 달리
// userId/insIp가 포함됨(관리자만 보는 값이라 별도 타입으로 분리)
export type ReservationHistoryLog = {
  historyId: number;
  userId: string;
  seatId: number;
  roundId: number;
  reservedStatus: "RESERVED" | "CANCELLED";
  createdReserved: string;
  insIp: string;
  seatRow: string;
  seatColume: string;
  grade: string;
  pTitle: string;
  roundTime: string;
};
