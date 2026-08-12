"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAdminCategories, createCategory, updateCategory, deleteCategory, type Category } from "@/lib/api/admin";
import { formatRoundTime } from "@/lib/utils/datetime";

type RowChange = { categoryNm?: string; sortOrder?: number; useYn?: string };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // categoryId → 변경된 값
  const [changes, setChanges] = useState<Record<number, RowChange>>({});
  const [saving, setSaving] = useState(false);

  const [newCategoryNm, setNewCategoryNm] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => getAdminCategories().then(setCategories);

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load().finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const changeCount = Object.keys(changes).length;

  // 원래 값으로 되돌아오면 dirty 표시(및 저장 대상)에서 빠지도록 처리
  const handleChange = (categoryId: number, field: keyof RowChange, value: string | number) => {
    const original = categories.find((c) => c.categoryId === categoryId);
    const isUnchanged = original !== undefined && (original as unknown as Record<string, unknown>)[field] === value;
    setChanges((prev) => {
      const rowChange: Record<string, unknown> = { ...prev[categoryId] };
      if (isUnchanged) {
        delete rowChange[field];
      } else {
        rowChange[field] = value;
      }
      const next = { ...prev };
      if (Object.keys(rowChange).length === 0) {
        delete next[categoryId];
      } else {
        next[categoryId] = rowChange as RowChange;
      }
      return next;
    });
    setMsg("");
  };

  const getVal = <T,>(categoryId: number, field: keyof RowChange, original: T): T =>
    (changes[categoryId]?.[field] as T) ?? original;

  const handleAdd = async () => {
    if (!newCategoryNm.trim()) return;
    setAdding(true);
    setMsg("");
    try {
      await createCategory({ categoryNm: newCategoryNm.trim() });
      setNewCategoryNm("");
      await load();
      setMsg("카테고리가 추가되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async () => {
    if (changeCount === 0) return;
    setSaving(true);
    setMsg("");
    try {
      await Promise.all(
        Object.entries(changes).map(([categoryIdStr, data]) => updateCategory(Number(categoryIdStr), data))
      );
      await load();
      setChanges({});
      setMsg(`${changeCount}건이 저장되었습니다.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 위/아래로 행 자체를 옮기고, 옮긴 두 카테고리의 순서값만 서로 맞바꿔서 그 둘만 dirty 표시.
  // 다른 필드처럼 바로 저장하지 않고 "미저장 변경사항"으로만 표시, "저장" 버튼을 눌러야 반영됨
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const target = categories[targetIndex];
    const currentSortOrder = getVal(current.categoryId, "sortOrder", current.sortOrder);
    const targetSortOrder = getVal(target.categoryId, "sortOrder", target.sortOrder);

    const reordered = [...categories];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setCategories(reordered);

    handleChange(current.categoryId, "sortOrder", targetSortOrder);
    handleChange(target.categoryId, "sortOrder", currentSortOrder);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm("이 카테고리를 삭제할까요? 연결된 공연이 있으면 삭제가 제한됩니다.")) return;
    setMsg("");
    try {
      await deleteCategory(categoryId);
      await load();
      setMsg("삭제되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><p className="loadingMsg">불러오는 중...</p></div>;

  return (
    <div className="pageWrap">
      <div className="adminPageHeader">
        <div>
          <h1 className="pageTitle">카테고리관리</h1>
          <p className="pageSubtitle">공연 카테고리를 등록·수정합니다.</p>
        </div>
        <div className="adminHeaderActions">
          {msg && <span className={msg.includes("실패") ? "errorMsg" : "successMsg"} style={{ margin: 0 }}>{msg}</span>}
          <button className="btnPrimary" onClick={handleSave} disabled={saving || changeCount === 0}>
            {saving ? "저장 중..." : changeCount > 0 ? `저장 (${changeCount}건)` : "저장"}
          </button>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardTitle">새 카테고리 추가</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="adminLabel">카테고리명</label>
            <input
              className="adminInput"
              value={newCategoryNm}
              onChange={(e) => setNewCategoryNm(e.target.value)}
              placeholder="예: 클래식"
            />
          </div>
          <button className="btnSecondary" onClick={handleAdd} disabled={adding}>
            {adding ? "추가 중..." : "행 추가"}
          </button>
        </div>
      </div>

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>카테고리명</th>
              <th>정렬순서</th>
              <th>사용여부</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, idx) => {
              const isDirty = !!changes[c.categoryId];
              // 아직 한 번도 수정 안 된 행은 등록자/등록일을 "최종수정" 자리에 대신 보여줌(등록도 최초의 터치로 취급)
              const lastEdit = c.uptDe ? { uptId: c.uptId, uptDe: c.uptDe } : { uptId: c.insId, uptDe: c.insDe };
              return (
                <tr key={c.categoryId} className={isDirty ? "adminRowDirty" : ""}>
                  <td>
                    <input
                      className={`adminInput${changes[c.categoryId]?.categoryNm !== undefined ? " dirty" : ""}`}
                      value={getVal(c.categoryId, "categoryNm", c.categoryNm)}
                      onChange={(e) => handleChange(c.categoryId, "categoryNm", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`adminInput${changes[c.categoryId]?.sortOrder !== undefined ? " dirty" : ""}`}
                      type="number"
                      style={{ width: 70 }}
                      value={getVal(c.categoryId, "sortOrder", c.sortOrder)}
                      onChange={(e) => handleChange(c.categoryId, "sortOrder", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[c.categoryId]?.useYn !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(c.categoryId, "useYn", c.useYn)}
                      onChange={(e) => handleChange(c.categoryId, "useYn", e.target.value)}
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="adminCellEmail">{lastEdit.uptId ?? "-"}</td>
                  <td className="adminCellEmail">{lastEdit.uptDe ? formatRoundTime(lastEdit.uptDe) : "-"}</td>
                  <td>
                    <button className="btnDanger" onClick={() => handleDelete(c.categoryId)}>삭제</button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="btnSecondary"
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        title="위로 이동"
                      >
                        ▲
                      </button>
                      <button
                        className="btnSecondary"
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === categories.length - 1}
                        title="아래로 이동"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
