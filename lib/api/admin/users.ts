import { apiFetch } from "../client";
import type { AdminUser, Role } from "@/lib/data/types";

// ============================================================
// GET /api/admin/users
// 백엔드: AdminController.java → getUsers()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 전체 사용자 목록 조회 (관리자 사용자 관리 화면)
//
// 사용 예시:
//   import { getAdminUsers } from "@/lib/api/admin";
//   useEffect(() => { getAdminUsers().then(setUsers); }, []);
//
// 응답 JSON (AdminUser[]):
//   [{ "userId": "test01", "userNm": "홍길동", "userEmail": "a@a.com",
//      "userStatus": "ACTIVE", "roleId": 1, "roleName": "일반회원" }]
// ============================================================
export const getAdminUsers = () => apiFetch<AdminUser[]>("/admin/users");

// ============================================================
// GET /api/admin/roles
// 백엔드: AdminController.java → getRoles()  (관리자만)
// 기능: 부여 가능한 역할(권한 등급) 목록 조회 — 사용자별 역할 변경 select 의 옵션으로 사용
//
// 응답 JSON (Role[]): [{ "roleId": 1, "roleName": "일반회원" }, { "roleId": 2, "roleName": "매니저" }]
// ============================================================
export const getRoles = () => apiFetch<Role[]>("/admin/roles");

// ============================================================
// PATCH /api/admin/users/{userId}
// 백엔드: AdminController.java → updateUser()  (관리자만)
// 기능: 사용자 한 명의 역할/상태 변경
//
// 사용 예시:
//   await updateUser("test01", { roleId: 2 });
//
// 요청 JSON (프론트 → 백엔드, body): { "roleId": 2, "userStatus": "ACTIVE" }
//   → 두 필드 다 선택값이라, 바꾸고 싶은 것만 넣어 보내면 됨
// 응답 JSON: { "success": true }
// ============================================================
export const updateUser = (userId: string, data: { roleId?: number; userStatus?: string }) =>
  apiFetch<{ success: boolean }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: data,
  });

// ============================================================
// PATCH /api/admin/users/batch
// 백엔드: AdminController.java → batchUpdateUsers()  (관리자만)
// 기능: 여러 사용자의 역할/상태를 한 번에 저장 (테이블에서 여러 줄 고친 다음 한 번에 저장 버튼 누를 때)
//
// 사용 예시:
//   // changes = { "test01": { roleId: 2 }, "test02": { userStatus: "BANNED" } }
//   await batchUpdateUsers(changes);
//
// 요청 JSON (프론트 → 백엔드, body):
//   changes 객체를 [{ userId, roleId?, userStatus? }, ...] 배열로 바꿔서 보냄
//   [ { "userId": "test01", "roleId": 2 }, { "userId": "test02", "userStatus": "BANNED" } ]
// 응답 JSON: { "success": true }
// ============================================================
export const batchUpdateUsers = (
  changes: Record<string, { roleId?: number; userStatus?: string }>
) =>
  apiFetch<{ success: boolean }>("/admin/users/batch", {
    method: "PATCH",
    body: Object.entries(changes).map(([userId, data]) => ({ userId, ...data })) as unknown as object,
  });
