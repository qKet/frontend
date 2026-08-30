import { apiFetch } from "../client";
import type { Category } from "@/lib/data/types";

// GET /api/admin/categories — AdminCategoryController.getCategories() (관리자만, 아니면 403)
// 등록된 공연 카테고리 전체 목록(사용여부 무관 — 공개용 GET /categories는 사용중(Y)인 것만 옴).
export const getAdminCategories = () => apiFetch<Category[]>("/admin/categories");

// POST /api/admin/categories — AdminCategoryController.createCategory() (관리자만)
// 새 카테고리 등록 — 이름이 이미 있으면 400.
export const createCategory = (data: Pick<Category, "categoryNm">) =>
  apiFetch<{ success: boolean }>("/admin/categories", { method: "POST", body: data });

// PUT /api/admin/categories/{categoryId} — AdminCategoryController.updateCategory() (관리자만)
// 필드는 선택적, 보낸 것만 반영됨. 이름을 다른 카테고리와 겹치게 바꾸면 400.
export const updateCategory = (
  categoryId: number,
  data: Partial<{ categoryNm: string; sortOrder: number; useYn: string }>
) => apiFetch<{ success: boolean }>(`/admin/categories/${categoryId}`, { method: "PUT", body: data });

// DELETE /api/admin/categories/{categoryId} — AdminCategoryController.deleteCategory() (관리자만)
// 이 카테고리로 등록된 공연이 있으면 400.
export const deleteCategory = (categoryId: number) =>
  apiFetch<{ success: boolean }>(`/admin/categories/${categoryId}`, { method: "DELETE" });
