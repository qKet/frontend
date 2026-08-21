"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getRoleMappings,
  updateRoleMappings,
  getRoles,
  type Program,
  type RoleProgram,
  type Role,
} from "@/lib/api/admin";
import { formatRoundTime } from "@/lib/utils/datetime";

type RowChange = { programNm?: string; urlPath?: string; programType?: string; useYn?: string };

export default function AdminProgramsPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [mappings, setMappings] = useState<Set<string>>(new Set());
  // programId → 그 프로그램의 권한 체크박스 중 가장 최근에 바뀐 것의 수정자/수정일
  // (그리드 저장은 전체 delete+insert라 매핑이 하나라도 바뀌면 해당 programId의 모든 role 매핑이 같은 시각으로 갱신됨)
  const [roleProgramMeta, setRoleProgramMeta] = useState<Record<number, { uptId: string | null; uptDe: string | null }>>({});
  const [loading, setLoading] = useState(true);

  // programId → 변경된 값
  const [changes, setChanges] = useState<Record<number, RowChange>>({});
  const [mappingsDirty, setMappingsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [keyword, setKeyword] = useState("");

  const [newProgram, setNewProgram] = useState({ programNm: "", urlPath: "", programType: "MENU" });
  const [adding, setAdding] = useState(false);

  const load = () =>
    Promise.all([getPrograms(), getRoles(), getRoleMappings()]).then(([p, r, m]) => {
      setPrograms(p);
      setRoles(r);
      setMappings(new Set(m.filter((x) => x.useYn !== "N").map((x) => `${x.roleId}-${x.programId}`)));

      const meta: Record<number, { uptId: string | null; uptDe: string | null }> = {};
      m.forEach((x) => {
        if (!x.uptDe) return;
        const cur = meta[x.programId];
        if (!cur || !cur.uptDe || x.uptDe > cur.uptDe) {
          meta[x.programId] = { uptId: x.uptId ?? null, uptDe: x.uptDe };
        }
      });
      setRoleProgramMeta(meta);
    });

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load().finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const changeCount = Object.keys(changes).length;
  const dirty = changeCount > 0 || mappingsDirty;

  const filteredPrograms = (() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return programs;
    return programs.filter(p =>
      p.programNm.toLowerCase().includes(kw) || p.urlPath.toLowerCase().includes(kw)
    );
  })();

  const handleChange = (programId: number, field: keyof RowChange, value: string) => {
    setChanges((prev) => ({ ...prev, [programId]: { ...prev[programId], [field]: value } }));
    setMsg("");
  };

  const getVal = (programId: number, field: keyof RowChange, original: string) =>
    changes[programId]?.[field] ?? original;

  const toggleMapping = (roleId: number, programId: number) => {
    const key = `${roleId}-${programId}`;
    setMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setMappingsDirty(true);
    setMsg("");
  };

  const handleAdd = async () => {
    if (!newProgram.programNm.trim() || !newProgram.urlPath.trim()) return;
    setAdding(true);
    setMsg("");
    try {
      await createProgram(newProgram as Pick<Program, "programNm" | "urlPath" | "programType">);
      setNewProgram({ programNm: "", urlPath: "", programType: "MENU" });
      await load();
      setMsg("프로그램이 추가되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (programId: number) => {
    if (!confirm("이 프로그램을 삭제할까요? 이 프로그램을 참조하는 메뉴가 있으면 실패할 수 있습니다.")) return;
    setMsg("");
    try {
      await deleteProgram(programId);
      await load();
      setMsg("삭제되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      if (changeCount > 0) {
        await Promise.all(
          Object.entries(changes).map(([programId, data]) => updateProgram(Number(programId), data))
        );
      }
      if (mappingsDirty) {
        const body: RoleProgram[] = [];
        mappings.forEach((key) => {
          const [roleId, programId] = key.split("-").map(Number);
          body.push({ roleId, programId });
        });
        await updateRoleMappings(body);
      }
      await load();
      setChanges({});
      setMappingsDirty(false);
      setMsg("저장되었습니다.");
    } catch {
      setMsg("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><p className="loadingMsg">불러오는 중...</p></div>;

  return (
    <div className="pageWrap">
      <div className="adminPageHeader">
        <div>
          <h1 className="pageTitle">프로그램관리</h1>
          <p className="pageSubtitle">화면(URL)을 등록하고, 역할별 접근권한을 체크박스로 관리합니다.</p>
        </div>
        <div className="adminHeaderActions">
          {msg && <span className={msg.includes("실패") ? "errorMsg" : "successMsg"} style={{ margin: 0 }}>{msg}</span>}
          <button className="btnPrimary" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardTitle">새 프로그램 추가</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label className="adminLabel">이름</label>
            <input
              className="adminInput"
              value={newProgram.programNm}
              onChange={(e) => setNewProgram((f) => ({ ...f, programNm: e.target.value }))}
              placeholder="예: 공지사항"
            />
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <label className="adminLabel">URL 경로</label>
            <input
              className="adminInput"
              value={newProgram.urlPath}
              onChange={(e) => setNewProgram((f) => ({ ...f, urlPath: e.target.value }))}
              placeholder="예: /notices"
            />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label className="adminLabel">타입</label>
            <select
              className="adminSelect"
              style={{ width: "100%" }}
              value={newProgram.programType}
              onChange={(e) => setNewProgram((f) => ({ ...f, programType: e.target.value }))}
            >
              <option value="MENU">MENU (메뉴 노출)</option>
              <option value="PAGE">PAGE (접근만)</option>
            </select>
          </div>
          <button className="btnSecondary" onClick={handleAdd} disabled={adding}>
            {adding ? "추가 중..." : "행 추가"}
          </button>
        </div>
      </div>

      <div className="adminFormRow">
        <span className="adminLabel">검색</span>
        <input
          type="text"
          className="adminInput"
          placeholder="프로그램 이름 또는 URL 경로로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>이름</th>
              <th>URL 경로</th>
              <th>타입</th>
              <th>사용여부</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
              {roles.map((r) => (
                <th key={r.roleId} style={{ textAlign: "center" }}>{r.roleName}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPrograms.length === 0 && (
              <tr><td colSpan={7 + roles.length} className="emptyMsg">검색 결과가 없습니다.</td></tr>
            )}
            {filteredPrograms.map((p) => {
              const isDirty = !!changes[p.programId];
              const roleMeta = roleProgramMeta[p.programId];
              // 아직 한 번도 수정 안 된 행은 등록자/등록일을 "최종수정" 자리에 대신 보여줌(등록도 최초의 터치로 취급)
              const programOwnEdit = p.uptDe ? { uptId: p.uptId, uptDe: p.uptDe } : { uptId: p.insId, uptDe: p.insDe };
              const lastEdit =
                roleMeta?.uptDe && (!programOwnEdit.uptDe || roleMeta.uptDe > programOwnEdit.uptDe)
                  ? roleMeta
                  : programOwnEdit;
              return (
                <tr key={p.programId} className={isDirty ? "adminRowDirty" : ""}>
                  <td>
                    <input
                      className={`adminInput${changes[p.programId]?.programNm !== undefined ? " dirty" : ""}`}
                      value={getVal(p.programId, "programNm", p.programNm)}
                      onChange={(e) => handleChange(p.programId, "programNm", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`adminInput${changes[p.programId]?.urlPath !== undefined ? " dirty" : ""}`}
                      value={getVal(p.programId, "urlPath", p.urlPath)}
                      onChange={(e) => handleChange(p.programId, "urlPath", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[p.programId]?.programType !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(p.programId, "programType", p.programType)}
                      onChange={(e) => handleChange(p.programId, "programType", e.target.value)}
                    >
                      <option value="MENU">MENU</option>
                      <option value="PAGE">PAGE</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[p.programId]?.useYn !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(p.programId, "useYn", p.useYn)}
                      onChange={(e) => handleChange(p.programId, "useYn", e.target.value)}
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="adminCellEmail">{lastEdit.uptId ?? "-"}</td>
                  <td className="adminCellEmail">{lastEdit.uptDe ? formatRoundTime(lastEdit.uptDe) : "-"}</td>
                  {roles.map((r) => (
                    <td key={r.roleId} style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={mappings.has(`${r.roleId}-${p.programId}`)}
                        onChange={() => toggleMapping(r.roleId, p.programId)}
                      />
                    </td>
                  ))}
                  <td>
                    <button className="btnDanger" onClick={() => handleDelete(p.programId)}>삭제</button>
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
