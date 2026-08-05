import { apiFetch } from "../client";
import type { Menu } from "@/lib/data/types";

// ============================================================
// GET /api/admin/menus
// 백엔드: MenuController.java → getMenus()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 등록된 메뉴 전체 목록 조회 (메뉴관리 그리드, sort_order 순)
//
// 응답 JSON (Menu[]):
//   [{ "menuId": 1, "programId": 1, "programNm": "공연 목록", "urlPath": "/",
//      "parentMenuId": null, "menuNm": "공연", "sortOrder": 1, "useYn": "Y" }]
// ============================================================
export const getMenus = () => apiFetch<Menu[]>("/admin/menus");

// ============================================================
// POST /api/admin/menus
// 백엔드: MenuController.java → createMenu()  (관리자만)
// 기능: 새 메뉴(그리드 행) 추가 — programId를 안 주면(null) 연결된 페이지가 없는 "그룹 전용" 메뉴가 됨
//   (예: 하위메뉴만 모아서 보여주는 상단 "관리자" 드롭다운). 반드시 하위메뉴가 하나 이상 있어야
//   화면에 노출됨 — 하위메뉴가 없는 그룹은 SiteNav에서 자동으로 숨겨짐
//
// 요청 JSON (body): { "programId": 5, "parentMenuId": null, "menuNm": "사용자 관리", "sortOrder": 4 }
// 응답 JSON: { "success": true }
// ============================================================
export const createMenu = (
  data: Pick<Menu, "menuNm"> & Partial<Pick<Menu, "programId" | "parentMenuId" | "sortOrder">>
) => apiFetch<{ success: boolean }>("/admin/menus", { method: "POST", body: data });

// ============================================================
// PUT /api/admin/menus/{menuId}
// 백엔드: MenuController.java → updateMenu()  (관리자만)
// 기능: 메뉴 이름/순서/부모/연결 프로그램/사용여부 수정 (그리드에서 셀 수정 후 저장)
//
// ⚠️ programId/parentMenuId는 "없음"으로 지우는 것도 정상 케이스라, 항상 그 행의 전체 값을 담아서
//   보내야 함 (부분 필드만 보내면 백엔드가 나머지를 null로 덮어씀 — MenuMapper.xml 참고)
// ============================================================
export const updateMenu = (
  menuId: number,
  data: {
    programId: number | null;
    parentMenuId: number | null;
    menuNm: string;
    sortOrder: number;
    useYn: string;
  }
) => apiFetch<{ success: boolean }>(`/admin/menus/${menuId}`, { method: "PUT", body: data });

// ============================================================
// DELETE /api/admin/menus/{menuId}
// 백엔드: MenuController.java → deleteMenu()  (관리자만)
// 기능: 메뉴(그리드 행) 삭제. 하위 메뉴가 남아있으면 실패함 (자식부터 지워야 함)
// ============================================================
export const deleteMenu = (menuId: number) =>
  apiFetch<{ success: boolean }>(`/admin/menus/${menuId}`, { method: "DELETE" });
