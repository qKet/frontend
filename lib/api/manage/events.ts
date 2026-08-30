import { apiFetch } from "../client";
import type { Venue } from "@/lib/data/types";

// GET /api/manage/venues — AdminPerformanceController.getVenues() (매니저(roleId 2) 이상)
// 공연장 목록 — 공연 등록 폼의 "공연장 선택" select 옵션용.
export const getVenues = () => apiFetch<Venue[]>("/manage/venues");

// POST /api/manage/events — AdminPerformanceController.createPerformance() (매니저 이상)
// 공연 신규 등록(제목/공연장/포스터/회차 목록 한 번에 생성).
// ⚠️ roundTime/openTime은 "YYYY-MM-DD HH:mm:ss"(MySQL DATETIME) 형식이어야 함 —
// <input type="datetime-local"> 값은 toMysqlDatetime() 같은 변환을 거쳐서 보낼 것.
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

// POST /api/manage/events/{performanceId}/rounds — AdminPerformanceController.addRound() (매니저 이상)
// 기존 공연에 회차 하나 추가.
export const addRound = (
  performanceId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean; roundId: number }>(
    `/manage/events/${performanceId}/rounds`,
    { method: "POST", body: data }
  );

// PUT /api/manage/events/{performanceId} — AdminPerformanceController.updatePerformance() (매니저 이상)
// 공연 정보 수정 — 필드는 선택적, 보낸 것만 반영됨.
// ⚠️ 이미 예매 오픈 시간이 지난 회차는 백엔드가 수정을 무시함(hasPassedRoundById 체크).
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

// DELETE /api/manage/events/{performanceId} — AdminPerformanceController.deletePerformance() (매니저 이상)
// ⚠️ 오픈된(예매 시작된) 회차가 하나라도 있으면 400으로 거부됨.
export const deletePerformance = (
  performanceId: number
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}`,
    { method: "DELETE" }
  );

// DELETE /api/manage/events/{performanceId}/rounds/{roundId} — AdminPerformanceController.deleteRound()
// (매니저 이상) 오픈 시간 지난 회차는 400으로 거부됨.
export const deleteRound = (
  performanceId: number,
  roundId: number
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}/rounds/${roundId}`,
    { method: "DELETE" }
  );

// PUT /api/manage/events/{performanceId}/rounds/{roundId} — AdminPerformanceController.updateRound()
// (매니저 이상) 회차 시간 수정 — 오픈 시간 지난 회차는 400으로 거부됨.
export const updateRound = (
  performanceId: number,
  roundId: number,
  data: { roundTime: string; openTime: string }
) =>
  apiFetch<{ success: boolean }>(
    `/manage/events/${performanceId}/rounds/${roundId}`,
    { method: "PUT", body: data }
  );
