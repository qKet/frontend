import { apiFetch } from "../client";
import type { Program, RoleProgram } from "@/lib/data/types";

// ============================================================
// GET /api/admin/programs
// 백엔드: ProgramController.java → getPrograms()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 등록된 화면(URL) 목록 조회 (프로그램관리 그리드)
//
// 응답 JSON (Program[]):
//   [{ "programId": 1, "programNm": "공연 목록", "urlPath": "/", "programType": "MENU", "useYn": "Y" }]
// ============================================================
export const getPrograms = () => apiFetch<Program[]>("/admin/programs");

// ============================================================
// POST /api/admin/programs
// 백엔드: ProgramController.java → createProgram()  (관리자만)
// 기능: 새 화면(URL) 등록
//
// 요청 JSON (body): { "programNm": "공지사항", "urlPath": "/notices", "programType": "MENU" }
// 응답 JSON: { "success": true }
// ============================================================
export const createProgram = (data: Pick<Program, "programNm" | "urlPath" | "programType">) =>
  apiFetch<{ success: boolean }>("/admin/programs", { method: "POST", body: data });

// ============================================================
// PUT /api/admin/programs/{programId}
// 백엔드: ProgramController.java → updateProgram()  (관리자만)
// 기능: 화면 정보(이름/경로/타입/사용여부) 수정
// ============================================================
export const updateProgram = (
  programId: number,
  data: Partial<{ programNm: string; urlPath: string; programType: string; useYn: string }>
) => apiFetch<{ success: boolean }>(`/admin/programs/${programId}`, { method: "PUT", body: data });

// ============================================================
// DELETE /api/admin/programs/{programId}
// 백엔드: ProgramController.java → deleteProgram()  (관리자만)
// 기능: 화면 삭제 (연결된 권한 매핑도 함께 삭제됨). 이 프로그램을 가리키는 메뉴가 남아있으면 실패함
// ============================================================
export const deleteProgram = (programId: number) =>
  apiFetch<{ success: boolean }>(`/admin/programs/${programId}`, { method: "DELETE" });

// ============================================================
// GET /api/admin/programs/role-mappings
// 백엔드: ProgramController.java → getRoleMappings()  (관리자만)
// 기능: 역할×프로그램 접근권한 매핑 전체 조회 (권한 그리드: 행=프로그램, 열=역할 체크박스)
//
// 응답 JSON (RoleProgram[]): [{ "roleId": 1, "programId": 1 }, { "roleId": 2, "programId": 1 }]
// ============================================================
export const getRoleMappings = () => apiFetch<RoleProgram[]>("/admin/programs/role-mappings");

// ============================================================
// PUT /api/admin/programs/role-mappings
// 백엔드: ProgramController.java → updateRoleMappings()  (관리자만)
// 기능: 권한 그리드에서 체크한 상태를 그대로 저장 — 보낸 목록이 최종 상태 전체이므로
//   기존 매핑을 통째로 지우고 다시 저장함 (부분 갱신 아님, 매번 전체를 보내야 함)
//
// 사용 예시:
//   await updateRoleMappings([{ roleId: 1, programId: 1 }, { roleId: 3, programId: 5 }]);
// ============================================================
export const updateRoleMappings = (mappings: RoleProgram[]) =>
  apiFetch<{ success: boolean }>("/admin/programs/role-mappings", { method: "PUT", body: mappings as unknown as object });
