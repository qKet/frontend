import { apiFetch } from "../client";
import type { Program, RoleProgram } from "@/lib/data/types";

// GET /api/admin/programs — ProgramController.getPrograms() (관리자만, 아니면 403)
// 등록된 화면(URL) 목록(프로그램관리 그리드).
export const getPrograms = () => apiFetch<Program[]>("/admin/programs");

// POST /api/admin/programs — ProgramController.createProgram() (관리자만)
export const createProgram = (data: Pick<Program, "programNm" | "urlPath" | "programType">) =>
  apiFetch<{ success: boolean }>("/admin/programs", { method: "POST", body: data });

// PUT /api/admin/programs/{programId} — ProgramController.updateProgram() (관리자만)
export const updateProgram = (
  programId: number,
  data: Partial<{ programNm: string; urlPath: string; programType: string; useYn: string }>
) => apiFetch<{ success: boolean }>(`/admin/programs/${programId}`, { method: "PUT", body: data });

// DELETE /api/admin/programs/{programId} — ProgramController.deleteProgram() (관리자만)
// 연결된 권한 매핑도 함께 삭제됨. 이 프로그램을 가리키는 메뉴가 남아있으면 실패.
export const deleteProgram = (programId: number) =>
  apiFetch<{ success: boolean }>(`/admin/programs/${programId}`, { method: "DELETE" });

// GET /api/admin/programs/role-mappings — ProgramController.getRoleMappings() (관리자만)
// 역할×프로그램 접근권한 매핑 전체 조회(권한 그리드: 행=프로그램, 열=역할 체크박스).
export const getRoleMappings = () => apiFetch<RoleProgram[]>("/admin/programs/role-mappings");

// PUT /api/admin/programs/role-mappings — ProgramController.updateRoleMappings() (관리자만)
// 권한 그리드 체크 상태를 그대로 저장 — 부분 갱신이 아니라 매번 전체 목록을 보내야 함
// (기존 매핑을 통째로 지우고 다시 저장).
export const updateRoleMappings = (mappings: RoleProgram[]) =>
  apiFetch<{ success: boolean }>("/admin/programs/role-mappings", { method: "PUT", body: mappings as unknown as object });
