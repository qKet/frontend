import { apiFetch } from "../client";
import type { Menu } from "@/lib/data/types";

// GET /api/admin/menus — MenuController.getMenus() (관리자만, 아니면 403)
// 등록된 메뉴 전체 목록(메뉴관리 그리드, sort_order 순).
export const getMenus = () => apiFetch<Menu[]>("/admin/menus");

// POST /api/admin/menus — MenuController.createMenu() (관리자만)
// 새 메뉴 추가 — programId를 안 주면 연결 페이지 없는 "그룹 전용" 메뉴(하위메뉴가 있어야 노출됨).
export const createMenu = (
  data: Pick<Menu, "menuNm"> & Partial<Pick<Menu, "programId" | "parentMenuId" | "sortOrder">>
) => apiFetch<{ success: boolean }>("/admin/menus", { method: "POST", body: data });

// PUT /api/admin/menus/{menuId} — MenuController.updateMenu() (관리자만)
// ⚠️ programId/parentMenuId는 항상 그 행의 전체 값을 담아서 보내야 함 — 부분 필드만 보내면
// 백엔드가 나머지를 null로 덮어씀(MenuMapper.xml 참고).
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

// DELETE /api/admin/menus/{menuId} — MenuController.deleteMenu() (관리자만)
// 하위 메뉴가 남아있으면 실패(자식부터 지워야 함).
export const deleteMenu = (menuId: number) =>
  apiFetch<{ success: boolean }>(`/admin/menus/${menuId}`, { method: "DELETE" });
