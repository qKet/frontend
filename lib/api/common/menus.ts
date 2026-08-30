import { apiFetch } from "../client";
import type { MenuTreeNode } from "@/lib/data/types";

// GET /api/common/menus/my — CommonController.getMyMenus() (로그인만 하면 가능, 아니면 401)
// 로그인 사용자의 role이 접근 가능한 메뉴를 트리 구조로 조회(SiteNav 렌더링용) —
// PROGRAMS/ROLE_PROGRAMS/MENUS 테이블 기반, 관리자 화면에서 등록/수정한 내용이 그대로 반영됨.
export const getMyMenus = () => apiFetch<MenuTreeNode[]>("/common/menus/my");
