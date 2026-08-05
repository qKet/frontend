"use client";

// 관리자가 새 공연을 등록하는 폼 페이지
// 공연명, 공연장, 포스터 이미지 업로드, 회차(날짜/시간) 추가

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getVenues, createPerformance, type Venue } from "@/lib/api/manage";
import { uploadImage } from "@/lib/api/common";
import { getCategories } from "@/lib/api/events";
import type { Category } from "@/lib/data/types";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

type Round = { roundTime: string; openTime: string };
type NewPerformance = { pTitle: string; venueId: number; categoryId: number; posterUrl: string };

const EMPTY_ROUND: Round = { roundTime: "", openTime: "" };

// datetime-local 값(2026-08-15T19:00) → MySQL DATETIME(2026-08-15 19:00:00)
const toMysqlDatetime = (v: string) => {
  if (!v) return v;
  const withSeconds = v.length === 16 ? v + ":00" : v;
  return withSeconds.replace("T", " ");
};

export default function AdminPerformancesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [perfForm, setPerfForm] = useState<NewPerformance>({ pTitle: "", venueId: 0, categoryId: 0, posterUrl: "" });
  const [perfRounds, setPerfRounds] = useState<Round[]>([EMPTY_ROUND]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // 필수 필드 refs
  const titleRef = useRef<HTMLInputElement>(null);
  const roundRefs = useRef<{ roundTime: HTMLInputElement | null; openTime: HTMLInputElement | null }[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || (userSession.roleId !== 2 && userSession.roleId !== 3)) {
      router.replace("/");
      return;
    }
    Promise.all([getVenues(), getCategories()])
      .then(([v, c]) => {
        setVenues(v);
        setCategories(c);
        setPerfForm(f => ({
          ...f,
          venueId: v.length > 0 ? v[0].venueId : 0,
          categoryId: c.length > 0 ? c[0].categoryId : 0,
        }));
      })
      .finally(() => setLoading(false));
  }, [isLoading, userSession]);

  // 회차 row refs 배열 동기화
  useEffect(() => {
    roundRefs.current = roundRefs.current.slice(0, perfRounds.length);
    while (roundRefs.current.length < perfRounds.length)
      roundRefs.current.push({ roundTime: null, openTime: null });
  }, [perfRounds.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPerfForm(f => ({ ...f, posterUrl: url }));
    } catch (err: any) {
      setMsg({ text: err?.message ?? "이미지 업로드에 실패했습니다.", ok: false });
    } finally {
      setUploading(false);
    }
  };

  const handleAddRoundRow = () => setPerfRounds(r => [...r, { ...EMPTY_ROUND }]);
  const handleRemoveRoundRow = (i: number) => setPerfRounds(r => r.filter((_, idx) => idx !== i));
  const handleRoundChange = (i: number, field: keyof Round, value: string) =>
    setPerfRounds(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    // 필수값 검증 + focus
    if (!perfForm.pTitle.trim()) {
      titleRef.current?.focus();
      setMsg({ text: "공연 제목을 입력하세요.", ok: false });
      return;
    }
    for (let i = 0; i < perfRounds.length; i++) {
      if (!perfRounds[i].roundTime) {
        roundRefs.current[i]?.roundTime?.focus();
        setMsg({ text: `${i + 1}번 회차의 공연 시간을 입력하세요.`, ok: false });
        return;
      }
      if (!perfRounds[i].openTime) {
        roundRefs.current[i]?.openTime?.focus();
        setMsg({ text: `${i + 1}번 회차의 예매 오픈 시간을 입력하세요.`, ok: false });
        return;
      }
    }

    setSaving(true);
    try {
      const { performanceId } = await createPerformance({
        ...perfForm,
        rounds: perfRounds.map(r => ({
          roundTime: toMysqlDatetime(r.roundTime),
          openTime: toMysqlDatetime(r.openTime),
        })),
      });
      setMsg({ text: `공연이 등록되었습니다. (ID: ${performanceId})`, ok: true });
      setPerfForm({ pTitle: "", venueId: venues[0]?.venueId ?? 0, categoryId: categories[0]?.categoryId ?? 0, posterUrl: "" });
      setPerfRounds([{ ...EMPTY_ROUND }]);
      setPreviewUrl("");
      setTimeout(() => router.push("/performances"), 1200);
    } catch (err: any) {
      setMsg({ text: err?.message ?? "공연 추가에 실패했습니다.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><StatusMessage variant="loading">불러오는 중...</StatusMessage></div>;

  return (
    <PageHeader
      variant="admin"
      title="공연 추가"
      subtitle="새 공연과 회차를 등록합니다."
      actions={
        <Button variant="secondary" onClick={() => router.push("/performances")}>
          ← 목록으로
        </Button>
      }
    >
      <div className="adminCard">
        <h2 className="adminCardTitle">공연 추가</h2>
        <form className="adminForm" onSubmit={handleSubmit}>

          {/* 제목 */}
          <FormField variant="admin" label="공연 제목" required>
            <Input
              variant="admin"
              ref={titleRef}
              placeholder="공연 제목을 입력하세요"
              value={perfForm.pTitle}
              onChange={e => setPerfForm(f => ({ ...f, pTitle: e.target.value }))}
            />
          </FormField>

          {/* 공연장 */}
          <FormField variant="admin" label="공연장" required>
            <select
              className="adminInput"
              value={perfForm.venueId}
              onChange={e => setPerfForm(f => ({ ...f, venueId: Number(e.target.value) }))}
            >
              {venues.map(v => (
                <option key={v.venueId} value={v.venueId}>{v.venueName}</option>
              ))}
            </select>
          </FormField>

          {/* 카테고리 */}
          <FormField variant="admin" label="카테고리" required>
            <select
              className="adminInput"
              value={perfForm.categoryId}
              onChange={e => setPerfForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
            >
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryNm}</option>
              ))}
            </select>
          </FormField>

          {/* 포스터 이미지 */}
          <FormField variant="admin" label="포스터 이미지">
            <div className="adminPosterWrap">
              {previewUrl && (
                <div className="adminPosterPreview">
                  <img src={previewUrl} alt="포스터 미리보기" />
                  {uploading && <div className="adminPosterOverlay">업로드 중...</div>}
                </div>
              )}
              <label className="adminFileLabel">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {previewUrl ? "이미지 변경" : "이미지 선택"}
              </label>
              {perfForm.posterUrl && !uploading && (
                <span className="adminUploadDone">✓ 업로드 완료</span>
              )}
            </div>
          </FormField>

          {/* 회차 */}
          <div className="adminFormSection">
            <div className="adminFormSectionHeader">
              <span className="adminLabel">회차 목록 <span className="adminRequired">*</span></span>
              <Button type="button" variant="secondary" onClick={handleAddRoundRow}>+ 회차 추가</Button>
            </div>
            {perfRounds.map((round, i) => (
              <div key={i} className="adminRoundRow">
                <FormField variant="admin" label={`${i + 1}회차 공연 시간`} required style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    variant="admin"
                    type="datetime-local"
                    value={round.roundTime}
                    ref={el => { if (roundRefs.current[i]) roundRefs.current[i].roundTime = el; }}
                    onChange={e => handleRoundChange(i, "roundTime", e.target.value)}
                  />
                </FormField>
                <FormField variant="admin" label="예매 오픈 시간" required style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    variant="admin"
                    type="datetime-local"
                    value={round.openTime}
                    ref={el => { if (roundRefs.current[i]) roundRefs.current[i].openTime = el; }}
                    onChange={e => handleRoundChange(i, "openTime", e.target.value)}
                  />
                </FormField>
                {perfRounds.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    style={{ alignSelf: "flex-end" }}
                    onClick={() => handleRemoveRoundRow(i)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>

          {msg && (
            <StatusMessage variant={msg.ok ? "success" : "error"}>{msg.text}</StatusMessage>
          )}

          <Button variant="primary" type="submit" disabled={saving || uploading}>
            {saving ? "등록 중..." : "공연 등록"}
          </Button>
        </form>
      </div>
    </PageHeader>
  );
}
