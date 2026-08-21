"use client";

// 등록된 공연목록을 관리자가 보고 수정, 삭제하는 화면

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  addRound,
  updatePerformance,
  deletePerformance,
  deleteRound,
} from "@/lib/api/manage";
import { uploadImage } from "@/lib/api/common";
import { getEventsPaged, getCategories } from "@/lib/api/events";
import type { Category, PageResponse, Performance, PerformanceRound } from "@/lib/data/types";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

const toMysqlDatetime = (v: string) => {
  if (!v) return v;
  return (v.length === 16 ? v + ":00" : v).replace("T", " ");
};

// API에서 오는 "2026-08-15 19:00:00" → datetime-local 입력값 "2026-08-15T19:00"
const toInputDatetime = (v: string) => {
  if (!v) return "";
  return v.replace(" ", "T").substring(0, 16);
};

const isLocked = (perf: Performance) =>
  perf.rounds?.some(r => new Date(r.openTime) <= new Date()) ?? false;

// 홈(app/page.tsx)이 60초 캐시(next: { revalidate: 60 })를 쓰기 때문에, 여기서 공연/회차를
// 수정·삭제해도 최악의 경우 60초 넘게 홈에 반영이 안 될 수 있음. 변경 성공 직후 이걸 호출해서
// 홈 캐시를 즉시 무효화함 (app/revalidate/route.ts 참고).
const revalidateHome = () => fetch("/revalidate", { method: "POST" }).catch(() => {});

// 한 페이지에 보여줄 공연 개수
const PAGE_SIZE = 10;

export default function AdminPerformancesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 목록 필터 — 카테고리 선택은 즉시 재조회, 검색어는 검색 버튼/엔터로 재조회
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  // 페이징 — 10개씩
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 수정 모달
  const [editingPerf, setEditingPerf] = useState<Performance | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(0);
  const [editPosterUrl, setEditPosterUrl] = useState("");
  const [editPreview, setEditPreview] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // 회차 수정 값 추적: { [roundId]: { roundTime, openTime } }
  const [roundEdits, setRoundEdits] = useState<Record<number, { roundTime: string; openTime: string }>>({});

  // 회차 추가 (수정 모달 내)
  const [newRound, setNewRound] = useState({ roundTime: "", openTime: "" });
  const [addingRound, setAddingRound] = useState(false);

  const editTitleRef = useRef<HTMLInputElement>(null);

  // 목록 재조회 — 카테고리/검색어/페이지 조합으로 호출
  const loadPerformances = (p: number, catId?: number, kw?: string) =>
    getEventsPaged(p, PAGE_SIZE, catId, kw).then((res: PageResponse<Performance>) => {
      setPerformances(res.content);
      setTotalPages(res.totalPages);
      setPage(res.page);
    });

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || (userSession.roleId !== 2 && userSession.roleId !== 3)) {
      router.replace("/");
      return;
    }
    Promise.all([loadPerformances(1), getCategories()])
      .then(([, cats]) => setCategories(cats))
      .finally(() => setLoading(false));
  }, [isLoading, userSession]);

  // 카테고리 선택 시 바로 재조회 (검색어는 그대로 유지, 1페이지부터 다시)
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    loadPerformances(1, value ? Number(value) : undefined, keyword || undefined);
  };

  // 검색 버튼/엔터: 현재 선택된 카테고리 안에서 제목·공연장 검색 (1페이지부터 다시)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = searchInput.trim();
    setKeyword(kw);
    loadPerformances(1, categoryFilter ? Number(categoryFilter) : undefined, kw || undefined);
  };

  // 페이지 이동 — 현재 카테고리/검색어 유지
  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    loadPerformances(p, categoryFilter ? Number(categoryFilter) : undefined, keyword || undefined);
  };

  const openEdit = (perf: Performance) => {
    setEditingPerf(perf);
    setEditTitle(perf.pTitle);
    setEditCategoryId(perf.categoryId);
    setEditPosterUrl(perf.posterUrl ?? "");
    setEditPreview(perf.posterUrl ?? "");
    setEditMsg(null);
    setNewRound({ roundTime: "", openTime: "" });
    // 기존 회차 값을 input 형식으로 초기화
    const edits: Record<number, { roundTime: string; openTime: string }> = {};
    perf.rounds?.forEach(r => {
      edits[r.roundId] = {
        roundTime: toInputDatetime(r.roundTime),
        openTime: toInputDatetime(r.openTime),
      };
    });
    setRoundEdits(edits);
  };

  const closeEdit = () => { setEditingPerf(null); setEditMsg(null); };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPreview(URL.createObjectURL(file));
    setEditUploading(true);
    try {
      const url = await uploadImage(file);
      setEditPosterUrl(url);
    } catch (err: any) {
      setEditMsg({ text: err?.message ?? "이미지 업로드 실패", ok: false });
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingPerf) return;
    if (!editTitle.trim()) { editTitleRef.current?.focus(); setEditMsg({ text: "제목을 입력하세요.", ok: false }); return; }
    setEditSaving(true);
    try {
      const unlockedRounds = (editingPerf.rounds ?? []).filter(r => new Date(r.openTime) > new Date());
      await updatePerformance(editingPerf.performanceId, {
        pTitle: editTitle,
        posterUrl: editPosterUrl,
        categoryId: editCategoryId,
        rounds: unlockedRounds.map(r => ({
          roundId: r.roundId,
          roundTime: toMysqlDatetime(roundEdits[r.roundId]?.roundTime ?? toInputDatetime(r.roundTime)),
          openTime: toMysqlDatetime(roundEdits[r.roundId]?.openTime ?? toInputDatetime(r.openTime)),
        })),
      });

      const newCategory = categories.find(c => c.categoryId === editCategoryId);
      setPerformances(prev =>
        prev.map(p => p.performanceId === editingPerf.performanceId
          ? {
              ...p,
              pTitle: editTitle,
              posterUrl: editPosterUrl,
              categoryId: editCategoryId,
              categoryNm: newCategory?.categoryNm ?? p.categoryNm,
            }
          : p)
      );
      setEditMsg({ text: "저장되었습니다.", ok: true });
      revalidateHome();
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "저장에 실패했습니다.", ok: false });
    } finally { setEditSaving(false); }
  };

  const handleDeleteRound = async (roundId: number) => {
    if (!editingPerf) return;
    if (!(await confirm("이 회차를 삭제하시겠습니까?", { danger: true }))) return;
    try {
      await deleteRound(editingPerf.performanceId, roundId);
      const updated = { ...editingPerf, rounds: editingPerf.rounds.filter(r => r.roundId !== roundId) };
      setEditingPerf(updated);
      setPerformances(prev => prev.map(p => p.performanceId === editingPerf.performanceId ? updated : p));
      revalidateHome();
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "회차 삭제에 실패했습니다.", ok: false });
    }
  };

  const handleAddRound = async () => {
    if (!editingPerf || !newRound.roundTime || !newRound.openTime) {
      setEditMsg({ text: "회차 시간을 모두 입력하세요.", ok: false });
      return;
    }
    setAddingRound(true);
    try {
      const { roundId } = await addRound(editingPerf.performanceId, {
        roundTime: toMysqlDatetime(newRound.roundTime),
        openTime: toMysqlDatetime(newRound.openTime),
      });
      const added: PerformanceRound = {
        roundId,
        performanceId: editingPerf.performanceId,
        roundTime: newRound.roundTime,
        openTime: newRound.openTime,
        roundStatus: "OPEN",
      };
      const updated = { ...editingPerf, rounds: [...(editingPerf.rounds ?? []), added] };
      setEditingPerf(updated);
      setPerformances(prev => prev.map(p => p.performanceId === editingPerf.performanceId ? updated : p));
      setNewRound({ roundTime: "", openTime: "" });
      setEditMsg({ text: "회차가 추가되었습니다.", ok: true });
      revalidateHome();
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "회차 추가에 실패했습니다.", ok: false });
    } finally { setAddingRound(false); }
  };

  const handleDeletePerformance = async (perf: Performance) => {
    if (isLocked(perf)) return;
    if (!(await confirm(`"${perf.pTitle}" 공연을 삭제하시겠습니까?`, { danger: true }))) return;
    try {
      await deletePerformance(perf.performanceId);
      setPerformances(prev => prev.filter(p => p.performanceId !== perf.performanceId));
      revalidateHome();
    } catch (e: any) {
      toast.error(e?.message ?? "삭제에 실패했습니다.");
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><StatusMessage variant="loading">불러오는 중...</StatusMessage></div>;

  const locked = editingPerf ? isLocked(editingPerf) : false;

  return (
    <PageHeader
      variant="admin"
      title="공연 관리"
      subtitle="공연을 수정하거나 삭제합니다."
      actions={
        <Button variant="primary" onClick={() => router.push("/performances/new")}>
          + 공연 추가
        </Button>
      }
    >
      {/* 카테고리 필터 + 검색 */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <FormField variant="admin" label="카테고리" style={{ marginBottom: 0, minWidth: 160 }}>
          <select
            className="adminInput"
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">전체</option>
            {categories.map(c => (
              <option key={c.categoryId} value={c.categoryId}>{c.categoryNm}</option>
            ))}
          </select>
        </FormField>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "var(--space-2)", flex: "1 1 240px", alignItems: "flex-end" }}>
          <FormField variant="admin" label="검색" style={{ marginBottom: 0, flex: 1 }}>
            <Input
              variant="admin"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="공연 제목 또는 공연장으로 검색"
            />
          </FormField>
          <Button variant="secondary" type="submit">검색</Button>
        </form>
      </div>

      {performances.length === 0 && <StatusMessage variant="loading">등록된 공연이 없습니다.</StatusMessage>}

      {performances.length > 0 && (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>번호</th>
                <th>포스터</th>
                <th>제목</th>
                <th>장소</th>
                <th>카테고리</th>
                <th>회차</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {performances.map((perf, idx) => {
                const locked = isLocked(perf);
                return (
                  <tr key={perf.performanceId}>
                    <td className="adminCellId">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      {perf.posterUrl
                        ? <img src={perf.posterUrl} alt={perf.pTitle} className="adminPerfThumb" />
                        : <div className="adminPerfThumbEmpty" />}
                    </td>
                    <td className="adminCellId">{perf.pTitle}</td>
                    <td>{perf.pLocation}</td>
                    <td>{perf.categoryNm}</td>
                    <td>
                      {(perf.rounds ?? []).length === 0 && "-"}
                      {(perf.rounds ?? []).map((r) => {
                        const roundLocked = new Date(r.openTime) <= new Date();
                        return (
                          <div key={r.roundId} className="adminPerfRoundDetail">
                            <span>공연 {toInputDatetime(r.roundTime).replace("T", " ")}</span>
                            <span>예매 {toInputDatetime(r.openTime).replace("T", " ")} {roundLocked && "🔒"}</span>
                          </div>
                        );
                      })}
                    </td>
                    <td>
                      <div className="adminPerfActions">
                        <Button variant="secondary" onClick={() => openEdit(perf)}>수정</Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeletePerformance(perf)}
                          disabled={locked}
                          title={locked ? "예매 오픈된 회차가 있어 삭제할 수 없습니다." : ""}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="페이지 이동">
          <button
            type="button"
            className={`paginationArrow${page <= 1 ? " paginationDisabled" : ""}`}
            onClick={() => handlePageChange(page - 1)}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`paginationItem${p === page ? " paginationItemActive" : ""}`}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={`paginationArrow${page >= totalPages ? " paginationDisabled" : ""}`}
            onClick={() => handlePageChange(page + 1)}
          >
            다음
          </button>
        </nav>
      )}

      {/* 수정 모달 */}
      {editingPerf && (
        <div className="adminModalOverlay" onClick={closeEdit}>
          <div className="adminModal" onClick={e => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h2 className="adminCardTitle" style={{ margin: 0 }}>공연 수정</h2>
              <button className="adminModalClose" onClick={closeEdit}>✕</button>
            </div>

            <div className="adminModalBody">
              {/* 제목 */}
              <FormField variant="admin" label="공연 제목" required>
                <Input
                  variant="admin"
                  ref={editTitleRef}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              </FormField>

              {/* 카테고리 */}
              <FormField variant="admin" label="카테고리" required>
                <select
                  className="adminInput"
                  value={editCategoryId}
                  onChange={e => setEditCategoryId(Number(e.target.value))}
                >
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.categoryNm}</option>
                  ))}
                </select>
              </FormField>

              {/* 포스터 */}
              <FormField variant="admin" label="포스터 이미지">
                <div className="adminPosterWrap">
                  {editPreview && (
                    <div className="adminPosterPreview">
                      <img src={editPreview} alt="미리보기" />
                      {editUploading && <div className="adminPosterOverlay">업로드 중...</div>}
                    </div>
                  )}
                  <label className="adminFileLabel">
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleEditFileChange} />
                    {editPreview ? "이미지 변경" : "이미지 선택"}
                  </label>
                </div>
              </FormField>

              {/* 회차 목록 */}
              <div className="adminFormSection">
                <label className="adminLabel" style={{ display: "block", marginBottom: "var(--space-2-5)" }}>회차 목록</label>
                {(editingPerf.rounds ?? []).length === 0 && (
                  <p style={{ fontSize: "var(--font-md)", color: "var(--text-3)", marginBottom: "var(--space-2-5)" }}>등록된 회차가 없습니다.</p>
                )}
                {(editingPerf.rounds ?? []).map((r, idx) => {
                  const roundLocked = new Date(r.openTime) <= new Date();
                  return (
                    <div key={r.roundId} className="adminRoundCard">
                      <div className="adminRoundCardHeader">
                        <span className="adminRoundNum">{idx + 1}회차</span>
                        {roundLocked && <span style={{ fontSize: "var(--font-sm)", color: "var(--error)" }}>🔒 오픈됨 — 수정 불가</span>}
                        <Button
                          variant="danger"
                          style={{ marginLeft: "auto", padding: "var(--space-1) var(--space-2-5)", fontSize: "var(--font-base)" }}
                          onClick={() => handleDeleteRound(r.roundId)}
                          disabled={roundLocked}
                          title={roundLocked ? "오픈된 회차는 삭제할 수 없습니다." : ""}
                        >
                          삭제
                        </Button>
                      </div>
                      <div className="adminRoundCardBody">
                        <FormField variant="admin" label="공연 시간" style={{ marginBottom: 0 }}>
                          <Input
                            variant="admin"
                            type="datetime-local"
                            disabled={roundLocked}
                            value={roundEdits[r.roundId]?.roundTime ?? ""}
                            onChange={e => setRoundEdits(prev => ({
                              ...prev,
                              [r.roundId]: { ...prev[r.roundId], roundTime: e.target.value },
                            }))}
                          />
                        </FormField>
                        <FormField variant="admin" label="예매 오픈" style={{ marginBottom: 0 }}>
                          <Input
                            variant="admin"
                            type="datetime-local"
                            disabled={roundLocked}
                            value={roundEdits[r.roundId]?.openTime ?? ""}
                            onChange={e => setRoundEdits(prev => ({
                              ...prev,
                              [r.roundId]: { ...prev[r.roundId], openTime: e.target.value },
                            }))}
                          />
                        </FormField>
                      </div>
                    </div>
                  );
                })}

                {/* 회차 추가 */}
                <div className="adminRoundRow" style={{ marginTop: "var(--space-2)" }}>
                  <FormField variant="admin" label="공연 시간" style={{ flex: 1, marginBottom: 0 }}>
                    <Input variant="admin" type="datetime-local" value={newRound.roundTime}
                      onChange={e => setNewRound(r => ({ ...r, roundTime: e.target.value }))} />
                  </FormField>
                  <FormField variant="admin" label="예매 오픈" style={{ flex: 1, marginBottom: 0 }}>
                    <Input variant="admin" type="datetime-local" value={newRound.openTime}
                      onChange={e => setNewRound(r => ({ ...r, openTime: e.target.value }))} />
                  </FormField>
                  <Button variant="secondary" style={{ alignSelf: "flex-end" }}
                    onClick={handleAddRound} disabled={addingRound}>
                    {addingRound ? "추가 중..." : "+ 회차"}
                  </Button>
                </div>
              </div>

              {editMsg && (
                <StatusMessage variant={editMsg.ok ? "success" : "error"}>{editMsg.text}</StatusMessage>
              )}
            </div>

            <div className="adminModalFooter">
              <Button variant="secondary" onClick={closeEdit}>닫기</Button>
              <Button variant="primary" onClick={handleEditSave} disabled={editSaving || editUploading}>
                {editSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageHeader>
  );
}
