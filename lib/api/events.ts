import { apiFetch } from "./client";
import type {
  Category,
  PageResponse,
  Performance,
  PerformanceDetail,
  PerformanceRound,
} from "../data/types";

// GET /api/events — PerformanceController.list()
// 전체 공연 목록 조회(메인/목록 화면용), categoryId/keyword로 필터·검색. rounds 배열까지 포함해서 옴.
export async function getEvents(categoryId?: number, keyword?: string): Promise<Performance[]> {
  const params = new URLSearchParams();
  if (categoryId != null) params.set("categoryId", String(categoryId));
  if (keyword) params.set("keyword", keyword);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Performance[]>(`/events${query}`);
}

// GET /api/events/paged — PerformanceController.pagedList()
// 공연 목록 페이지네이션 조회(page 1부터, size 기본 8), categoryId/keyword 필터 동일.
export async function getEventsPaged(
  page = 1,
  size = 8,
  categoryId?: number,
  keyword?: string
): Promise<PageResponse<Performance>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (categoryId != null) params.set("categoryId", String(categoryId));
  if (keyword) params.set("keyword", keyword);
  return apiFetch<PageResponse<Performance>>(`/events/paged?${params.toString()}`);
}

// GET /api/categories — CategoryController.list()
// 사용 중인 공연 카테고리 목록(홈 화면 필터, 공연 등록/수정 폼 선택용).
export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

// GET /api/events/{performanceId} — PerformanceController.detail()
// 공연 상세(제목/장소/포스터/회차/캐스팅). casts[].roundId가 null이면 전체 회차 공통 캐스팅,
// castingNm이 null이면 배역 개념 없는 공연(콘서트 등). 없는 공연이면 400(C001).
export async function getEvent(performanceId: number): Promise<PerformanceDetail> {
  return apiFetch<PerformanceDetail>(`/events/${performanceId}`);
}

// GET /api/events/{performanceId}/calendar — PerformanceController.calendar()
// 달력 화면에서 보고 있는 "그 달"의 회차만 조회(month="YYYY-MM", 생략 시 이번 달). 없으면 빈 배열.
export async function getEventCalendar(
  performanceId: number,
  month: string
): Promise<PerformanceRound[]> {
  return apiFetch<PerformanceRound[]>(`/events/${performanceId}/calendar?month=${month}`);
}
