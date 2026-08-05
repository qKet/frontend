export type AdminUser = {
  userId: string;
  userNm: string;
  userEmail: string;
  userStatus: string;
  roleId: number;
  roleName: string;
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
