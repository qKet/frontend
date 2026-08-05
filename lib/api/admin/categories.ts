import { apiFetch } from "../client";
import type { Category } from "@/lib/data/types";

// ============================================================
// GET /api/admin/categories
// 백엔드: AdminCategoryController.java → getCategories()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 등록된 공연 카테고리 전체 목록 조회 (카테고리관리 그리드, 사용여부 무관 — 공개용 GET /categories는 사용중(Y)인 것만 옴)
//
// 응답 JSON (Category[]):
//   [{ "categoryId": 1, "categoryNm": "콘서트", "sortOrder": 1, "useYn": "Y" }]
// ============================================================
export const getAdminCategories = () => apiFetch<Category[]>("/admin/categories");

// ============================================================
// POST /api/admin/categories
// 백엔드: AdminCategoryController.java → createCategory()  (관리자만)
// 기능: 새 공연 카테고리 등록 — 카테고리명이 이미 있으면 400 에러(ApiError)로 거부됨
//
// 요청 JSON (body): { "categoryNm": "클래식" }
// 응답 JSON: { "success": true }
// ============================================================
export const createCategory = (data: Pick<Category, "categoryNm">) =>
  apiFetch<{ success: boolean }>("/admin/categories", { method: "POST", body: data });

// ============================================================
// PUT /api/admin/categories/{categoryId}
// 백엔드: AdminCategoryController.java → updateCategory()  (관리자만)
// 기능: 카테고리 정보(이름/정렬순서/사용여부) 수정 — 필드는 선택적, 보낸 것만 반영됨.
//   카테고리명을 다른 카테고리와 겹치게 바꾸면 400 에러(ApiError)로 거부됨
//
// 요청 JSON (body): { "categoryNm": "클래식", "sortOrder": 6, "useYn": "Y" }
// 응답 JSON: { "success": true }
// ============================================================
export const updateCategory = (
  categoryId: number,
  data: Partial<{ categoryNm: string; sortOrder: number; useYn: string }>
) => apiFetch<{ success: boolean }>(`/admin/categories/${categoryId}`, { method: "PUT", body: data });

// ============================================================
// DELETE /api/admin/categories/{categoryId}
// 백엔드: AdminCategoryController.java → deleteCategory()  (관리자만)
// 기능: 카테고리 삭제 — 이 카테고리로 등록된 공연이 하나라도 있으면 400 에러(ApiError)로 거부됨
//
// 응답 JSON: { "success": true }
// ============================================================
export const deleteCategory = (categoryId: number) =>
  apiFetch<{ success: boolean }>(`/admin/categories/${categoryId}`, { method: "DELETE" });
