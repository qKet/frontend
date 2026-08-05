import { apiFetch } from "../client";
import type { Venue } from "@/lib/data/types";

// ============================================================
// GET /api/manage/venues
// 백엔드: AdminPerformanceController.java → getVenues()  (매니저(roleId 2) 이상)
// 기능: 공연장 목록 조회 — 공연 등록 폼의 "공연장 선택" select 옵션으로 사용
//
// 응답 JSON (Venue[]): [{ "venueId": 1, "venueName": "고척스카이돔" }]
// ============================================================
export const getVenues = () => apiFetch<Venue[]>("/manage/venues");

// ============================================================
// POST /api/manage/events
// 백엔드: AdminPerformanceController.java → createPerformance()  (매니저 이상)
// 기능: 공연 신규 등록 (제목, 공연장, 포스터, 회차 목록을 한 번에 생성)
//
// 사용 예시:
//   const { performanceId } = await createPerformance({
//     pTitle: "뮤지컬 지킬앤하이드",
//     venueId: 1,
//     categoryId: 2,
//     posterUrl: uploadedUrl,               // uploadImage()로 먼저 업로드한 결과
//     rounds: [{ roundTime: "2026-08-15 19:00:00", openTime: "2026-08-01 10:00:00" }],
//   });
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "pTitle": "...", "venueId": 1, "categoryId": 2, "posterUrl": "https://...", "rounds": [
//       { "roundTime": "2026-08-15 19:00:00", "openTime": "2026-08-01 10:00:00" }
//   ] }
//   ⚠️ roundTime/openTime 은 "YYYY-MM-DD HH:mm:ss" 형식(MySQL DATETIME)이어야 함
//      <input type="datetime-local"> 값은 "2026-08-15T19:00" 형태라 그대로 보내면 안 되고,
//      화면 코드의 toMysqlDatetime() 같은 변환 함수를 거쳐서 보내야 함
//
// 응답 JSON: { "success": true, "performanceId": 42 }
// ============================================================
export const createPerformance = (data: {
  pTitle: string;
  venueId: number;
  categoryId: number;
  posterUrl?: string;
  rounds: { roundTime: string; openTime: string }[];
}) =>
  apiFetch<{ success: boolean; performanceId: number }>("/manage/events", {
    method: "POST",
    body: data,
  });

// ============================================================
// POST /api/manage/events/{performanceId}/rounds
// 백엔드: AdminPerformanceController.java → addRound()  (매니저 이상)
// 기능: 기존 공연에 회차 하나 추가
//
// 요청 JSON: { "roundTime": "2026-08-16 19:00:00", "openTime": "2026-08-02 10:00:00" }
// 응답 JSON: { "success": true, "roundId": 15 }
// ============================================================
export const addRound = (
  performanceId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean; roundId: number }>(
    `/manage/events/${performanceId}/rounds`,
    { method: "POST", body: data }
  );

// ============================================================
// PUT /api/manage/events/{performanceId}
// 백엔드: AdminPerformanceController.java → updatePerformance()  (매니저 이상)
// 기능: 공연 정보 수정 (제목/포스터/회차 일괄 수정) — 필드는 선택적, 보낸 것만 반영됨
// ⚠️ 이미 예매 오픈 시간이 지난 회차는 백엔드가 수정을 무시함 (hasPassedRoundById 체크)
//
// 요청 JSON: { "pTitle": "...", "posterUrl": "...", "categoryId": 2, "rounds": [
//   { "roundId": 10, "roundTime": "...", "openTime": "..." }
// ] }
// 응답 JSON: { "success": true }
// ============================================================
export const updatePerformance = (
  performanceId: number,
  data: {
    pTitle?: string;
    posterUrl?: string;
    categoryId?: number;
    rounds?: { roundId: number; roundTime: string; openTime: string }[];
  }
) =>
  apiFetch<{ success: boolean }>(`/manage/events/${performanceId}`, {
    method: "PUT",
    body: data,
  });

// ============================================================
// DELETE /api/manage/events/{performanceId}
// 백엔드: AdminPerformanceController.java → deletePerformance()  (매니저 이상)
// 기능: 공연 삭제
// ⚠️ 오픈된(예매 시작된) 회차가 하나라도 있으면 백엔드가 400 에러로 거부함
//    → apiFetch가 자동으로 Error throw, catch(e) { alert(e.message) } 로 이유 보여주면 됨
//
// 응답 JSON: { "success": true }
// ============================================================
export const deletePerformance = (
  performanceId: number
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}`,
    { method: "DELETE" }
  );

// ============================================================
// DELETE /api/manage/events/{performanceId}/rounds/{roundId}
// 백엔드: AdminPerformanceController.java → deleteRound()  (매니저 이상)
// 기능: 특정 회차 삭제 — 오픈 시간 지난 회차는 400으로 거부됨
//
// 응답 JSON: { "success": true }
// ============================================================
export const deleteRound = (
  performanceId: number,
  roundId: number
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}/rounds/${roundId}`,
    { method: "DELETE" }
  );

// ============================================================
// PUT /api/manage/events/{performanceId}/rounds/{roundId}
// 백엔드: AdminPerformanceController.java → updateRound()  (매니저 이상)
// 기능: 회차 시간 수정 (공연 시간 / 예매 오픈 시간) — 오픈 시간 지난 회차는 400으로 거부됨
//
// 요청 JSON: { "roundTime": "2026-08-16 19:00:00", "openTime": "2026-08-02 10:00:00" }
// 응답 JSON: { "success": true }
// ============================================================
export const updateRound = (
  performanceId: number,
  roundId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}/rounds/${roundId}`,
    { method: "PUT", body: data }
  );
