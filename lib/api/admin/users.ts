import { apiFetch } from "../client";
import type { AdminUser, Role } from "@/lib/data/types";

// GET /api/admin/users — AdminController.getUsers() (관리자(roleId 3)만, 아니면 403)
// 전체 사용자 목록(관리자 사용자 관리 화면).
export const getAdminUsers = () => apiFetch<AdminUser[]>("/admin/users");

// GET /api/admin/roles — AdminController.getRoles() (관리자만)
// 부여 가능한 역할 목록 — 사용자별 역할 변경 select의 옵션으로 사용.
export const getRoles = () => apiFetch<Role[]>("/admin/roles");

// PATCH /api/admin/users/{userId} — AdminController.updateUser() (관리자만)
// 사용자 한 명의 역할/상태 변경 — roleId/userStatus 둘 다 선택값, 바꾸고 싶은 것만 보내면 됨.
export const updateUser = (userId: string, data: { roleId?: number; userStatus?: string }) =>
  apiFetch<{ success: boolean }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: data,
  });

// PATCH /api/admin/users/batch — AdminController.batchUpdateUsers() (관리자만)
// 여러 사용자의 역할/상태를 한 번에 저장(테이블에서 여러 줄 고친 뒤 일괄 저장).
export const batchUpdateUsers = (
  changes: Record<string, { roleId?: number; userStatus?: string }>
) =>
  apiFetch<{ success: boolean }>("/admin/users/batch", {
    method: "PATCH",
    body: Object.entries(changes).map(([userId, data]) => ({ userId, ...data })) as unknown as object,
  });
