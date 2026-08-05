import { apiFetch } from "./client";
import type {
  Category,
  PageResponse,
  Performance,
  PerformanceDetail,
  PerformanceRound,
} from "../data/types";

// ============================================================
// GET /api/events
// 백엔드: PerformanceController.java → list()
// 기능: 전체 공연 목록 조회 (메인/목록 화면용), categoryId로 카테고리 필터링·keyword로 제목/공연장 검색 가능
//
// 사용 예시:
//   import { getEvents } from "@/lib/api/events";
//
//   useEffect(() => {
//     getEvents().then(setPerformances).finally(() => setLoading(false));
//   }, []);
//
// 요청: categoryId(선택, 없으면 전체), keyword(선택, 제목/공연장 부분 일치) — query string
// 응답 JSON (Performance[] — 공연마다 rounds 배열까지 포함해서 옴):
//   [
//     {
//       "performanceId": 1,
//       "pTitle": "뮤지컬 지킬앤하이드",
//       "pLocation": "고척스카이돔",
//       "posterUrl": "https://.../poster.jpg",
//       "categoryId": 2,
//       "categoryNm": "뮤지컬",
//       "rounds": [
//         { "roundId": 10, "performanceId": 1, "roundTime": "2026-08-15 19:00:00",
//           "openTime": "2026-08-01 10:00:00", "roundStatus": "OPEN" }
//       ]
//     }
//   ]
// ============================================================
export async function getEvents(categoryId?: number, keyword?: string): Promise<Performance[]> {
  const params = new URLSearchParams();
  if (categoryId != null) params.set("categoryId", String(categoryId));
  if (keyword) params.set("keyword", keyword);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Performance[]>(`/events${query}`);
}

// ============================================================
// GET /api/events/paged
// 백엔드: PerformanceController.java → pagedList()
// 기능: 공연 목록 페이지 단위 조회 (메인 공연 목록 화면 페이지네이션용),
//      categoryId로 카테고리 필터링·keyword로 제목/공연장 검색 가능
//
// 사용 예시:
//   import { getEventsPaged } from "@/lib/api/events";
//
//   const { content, page, totalPages } = await getEventsPaged(1, 8, categoryId, keyword);
//
// 요청: page(1부터 시작, 기본 1), size(기본 8), categoryId(선택), keyword(선택) — query string
// 응답 JSON (PageResponse<Performance>):
//   {
//     "content": [
//       {
//         "performanceId": 1,
//         "pTitle": "뮤지컬 지킬앤하이드",
//         "pLocation": "고척스카이돔",
//         "posterUrl": "https://.../poster.jpg",
//         "categoryId": 2,
//         "categoryNm": "뮤지컬",
//         "rounds": [
//           { "roundId": 10, "performanceId": 1, "roundTime": "2026-08-15 19:00:00",
//             "openTime": "2026-08-01 10:00:00", "roundStatus": "OPEN" }
//         ]
//       }
//     ],
//     "page": 1,
//     "size": 8,
//     "totalCount": 42,
//     "totalPages": 6
//   }
// ============================================================
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

// ============================================================
// GET /api/categories
// 백엔드: CategoryController.java → list()
// 기능: 사용 중인 공연 카테고리 목록 조회 (홈 화면 카테고리 필터, 공연 등록/수정 폼의 카테고리 선택용)
//
// 사용 예시:
//   import { getCategories } from "@/lib/api/events";
//
//   const categories = await getCategories();
//
// 요청: 파라미터 없음
// 응답 JSON (Category[]):
//   [
//     { "categoryId": 1, "categoryNm": "콘서트", "sortOrder": 1, "useYn": "Y" },
//     { "categoryId": 2, "categoryNm": "뮤지컬", "sortOrder": 2, "useYn": "Y" }
//   ]
// ============================================================
export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

// ============================================================
// GET /api/events/{performanceId}
// 백엔드: PerformanceController.java → detail()
// 기능: 공연 상세 조회 (제목, 장소, 포스터, 회차 목록 + 캐스팅) — PER02_DETAIL01
//
// 사용 예시:
//   import { getEvent } from "@/lib/api/events";
//
//   const detail = await getEvent(performanceId);
//   const commonCasts = detail.casts.filter((c) => c.roundId === null);
//
// 요청: performanceId (path)
// 응답 JSON (PerformanceDetail — rounds 에 이어 casts 배열이 추가로 옴):
//   {
//     "performanceId": 5,
//     "pTitle": "뮤지컬 레미제라블",
//     "pLocation": "블루스퀘어 마스터카드홀",
//     "posterUrl": "https://.../poster.jpg",
//     "rounds": [
//       { "roundId": 10, "performanceId": 5, "roundTime": "2026-08-20 19:30:00",
//         "openTime": "2025-01-01 10:00:00", "roundStatus": "OPEN" }
//     ],
//     "casts": [
//       { "castId": 1, "performanceId": 5, "roundId": 10,
//         "actorName": "김민석", "castingNm": "장발장", "sortOrder": 0 },
//       { "castId": 7, "performanceId": 5, "roundId": null,
//         "actorName": "한지우", "castingNm": "판틴", "sortOrder": 2 }
//     ]
//   }
//   · casts[].roundId 가 null 이면 전체 회차 공통 캐스팅, 값이 있으면 그 회차 전용
//   · casts[].castingNm 이 null 이면 배역 개념이 없는 공연(콘서트 등)
//   · 없는 공연이면 400 (code: C001, "존재하지 않는 공연입니다.")
// ============================================================
export async function getEvent(performanceId: number): Promise<PerformanceDetail> {
  return apiFetch<PerformanceDetail>(`/events/${performanceId}`);
}

// ============================================================
// GET /api/events/{performanceId}/calendar
// 백엔드: PerformanceController.java → calendar()
// 기능: 달력 화면에서 보고 있는 "그 달"의 회차만 조회 — PER02_DETAIL02
//
// 사용 예시:
//   import { getEventCalendar } from "@/lib/api/events";
//
//   // 달 이동 시에만 호출 (날짜 클릭 필터는 받아온 목록으로 클라이언트에서 처리)
//   const rounds = await getEventCalendar(performanceId, "2026-09");
//
// 요청: performanceId (path), month("YYYY-MM", query) — 생략하면 백엔드가 이번 달로 처리
// 응답 JSON (PerformanceRound[]):
//   [
//     { "roundId": 20, "performanceId": 5, "roundTime": "2026-09-03 19:30:00",
//       "openTime": "2025-01-01 10:00:00", "roundStatus": "OPEN" }
//   ]
//   · 그 달에 회차가 없으면 빈 배열
// ============================================================
export async function getEventCalendar(
  performanceId: number,
  month: string
): Promise<PerformanceRound[]> {
  return apiFetch<PerformanceRound[]>(`/events/${performanceId}/calendar?month=${month}`);
}
