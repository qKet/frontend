import { apiFetch } from "../client";
import type { MenuTreeNode } from "@/lib/data/types";

// ============================================================
// GET /api/common/menus/my
// 백엔드: CommonController.java → getMyMenus()  (로그인만 하면 누구나 가능, 아니면 401)
// 기능: 로그인한 사용자의 role이 접근 가능한 메뉴를 트리 구조로 조회 (SiteNav 렌더링용)
//   PROGRAMS/ROLE_PROGRAMS/MENUS 테이블 기반 — 관리자가 관리자 화면(메뉴관리·프로그램관리)에서
//   등록/수정한 내용이 여기 그대로 반영됨
//
// 사용 예시:
//   import { getMyMenus } from "@/lib/api/common";
//   useEffect(() => { if (userSession) getMyMenus().then(setMenus); }, [userSession]);
//
// 응답 JSON (MenuTreeNode[]):
//   [{ "menuId": 2, "menuNm": "마이페이지", "urlPath": "/mypage", "sortOrder": 2,
//      "parentMenuId": null, "children": [] }]
// ============================================================
export const getMyMenus = () => apiFetch<MenuTreeNode[]>("/common/menus/my");
