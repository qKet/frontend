"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getPrograms,
  type Menu,
  type Program,
} from "@/lib/api/admin";
import { formatRoundTime } from "@/lib/utils/datetime";

type RowChange = { menuNm?: string; programId?: number | null; parentMenuId?: number | null; sortOrder?: number; useYn?: string };
type MenuRow = { menu: Menu; depth: number };

// 부모-자식(parentMenuId)을 트리로 묶어서 depth-first 순서로 펼침 (부모 바로 아래에 그 자식들이,
// sortOrder 순으로 나열됨). 부모가 삭제되는 등 참조가 끊긴 orphan 행은 놓치지 않도록 최상위로 취급
const buildMenuRows = (menus: Menu[]): MenuRow[] => {
  const byId = new Map(menus.map((m) => [m.menuId, m]));
  const byParent = new Map<number | null, Menu[]>();
  for (const m of menus) {
    const key = m.parentMenuId !== null && byId.has(m.parentMenuId) ? m.parentMenuId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(m);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  const rows: MenuRow[] = [];
  const visit = (parentId: number | null, depth: number) => {
    for (const m of byParent.get(parentId) ?? []) {
      rows.push({ menu: m, depth });
      visit(m.menuId, depth + 1);
    }
  };
  visit(null, 0);
  return rows;
};

// 상위 메뉴로 선택하면 트리에 순환이 생기는 후보(자기 자신 + 모든 하위메뉴)를 계산
const getDescendantIds = (menus: Menu[], menuId: number): Set<number> => {
  const childrenOf = new Map<number, number[]>();
  for (const m of menus) {
    if (m.parentMenuId === null) continue;
    if (!childrenOf.has(m.parentMenuId)) childrenOf.set(m.parentMenuId, []);
    childrenOf.get(m.parentMenuId)!.push(m.menuId);
  }
  const result = new Set<number>([menuId]);
  const stack = [...(childrenOf.get(menuId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    stack.push(...(childrenOf.get(id) ?? []));
  }
  return result;
};

export default function AdminMenusPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // menuId → 변경된 값
  const [changes, setChanges] = useState<Record<number, RowChange>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [newMenu, setNewMenu] = useState<{ menuNm: string; programId: number | ""; parentMenuId: number | ""; sortOrder: string }>({
    menuNm: "",
    programId: "",
    parentMenuId: "",
    sortOrder: "0",
  });
  const [adding, setAdding] = useState(false);

  const load = () =>
    Promise.all([getMenus(), getPrograms()]).then(([m, p]) => {
      setMenus(m);
      setPrograms(p);
    });

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load().finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const changeCount = Object.keys(changes).length;
  const menuRows = buildMenuRows(menus);

  const handleChange = <K extends keyof RowChange>(menuId: number, field: K, value: RowChange[K]) => {
    setChanges((prev) => ({ ...prev, [menuId]: { ...prev[menuId], [field]: value } }));
    setMsg("");
  };

  // parentMenuId처럼 "값을 null로 바꾼" 것도 정상 상태라 ?? 로는 "변경 안 함(undefined)"과 구분이 안 됨 →
  // changes에 그 필드 키가 실제로 있는지로 판단해야 함
  const getVal = <T,>(menuId: number, field: keyof RowChange, original: T): T => {
    const rowChange = changes[menuId];
    return rowChange && field in rowChange ? (rowChange[field] as T) : original;
  };

  const handleAdd = async () => {
    if (!newMenu.menuNm.trim()) return;
    setAdding(true);
    setMsg("");
    try {
      await createMenu({
        menuNm: newMenu.menuNm,
        programId: newMenu.programId === "" ? null : Number(newMenu.programId),
        parentMenuId: newMenu.parentMenuId === "" ? null : Number(newMenu.parentMenuId),
        sortOrder: Number(newMenu.sortOrder) || 0,
      });
      setNewMenu({ menuNm: "", programId: "", parentMenuId: "", sortOrder: "0" });
      await load();
      setMsg("메뉴가 추가되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (menuId: number) => {
    if (!confirm("이 메뉴를 삭제할까요? 하위 메뉴가 남아있으면 실패할 수 있습니다.")) return;
    setMsg("");
    try {
      await deleteMenu(menuId);
      await load();
      setMsg("삭제되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    if (changeCount === 0) return;
    setSaving(true);
    setMsg("");
    try {
      // programId/parentMenuId를 "없음"으로 지우는 것도 정상 케이스라 바뀐 필드만 보내면
      // 백엔드가 안 보낸 필드를 null로 덮어씀 → 항상 그 행의 최종 상태 전체를 합쳐서 보냄
      await Promise.all(
        Object.keys(changes).map((menuIdStr) => {
          const menuId = Number(menuIdStr);
          const original = menus.find((x) => x.menuId === menuId);
          if (!original) return Promise.resolve();
          return updateMenu(menuId, {
            menuNm: getVal(menuId, "menuNm", original.menuNm),
            programId: getVal(menuId, "programId", original.programId),
            parentMenuId: getVal(menuId, "parentMenuId", original.parentMenuId),
            sortOrder: getVal(menuId, "sortOrder", original.sortOrder),
            useYn: getVal(menuId, "useYn", original.useYn),
          });
        })
      );
      await load();
      setChanges({});
      setMsg(`${changeCount}건이 저장되었습니다.`);
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
          <h1 className="pageTitle">메뉴관리</h1>
          <p className="pageSubtitle">네비게이션에 노출되는 메뉴 순서·구조를 그리드에서 관리합니다.</p>
        </div>
        <div className="adminHeaderActions">
          {msg && <span className={msg.includes("실패") ? "errorMsg" : "successMsg"} style={{ margin: 0 }}>{msg}</span>}
          <button className="btnPrimary" onClick={handleSave} disabled={saving || changeCount === 0}>
            {saving ? "저장 중..." : changeCount > 0 ? `저장 (${changeCount}건)` : "저장"}
          </button>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardTitle">새 메뉴 추가</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label className="adminLabel">메뉴 이름</label>
            <input
              className="adminInput"
              value={newMenu.menuNm}
              onChange={(e) => setNewMenu((f) => ({ ...f, menuNm: e.target.value }))}
              placeholder="예: 공지사항"
            />
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <label className="adminLabel">연결 프로그램</label>
            <select
              className="adminSelect"
              style={{ width: "100%" }}
              value={newMenu.programId}
              onChange={(e) => setNewMenu((f) => ({ ...f, programId: e.target.value === "" ? "" : Number(e.target.value) }))}
            >
              <option value="">없음 (그룹 전용, 하위메뉴만 노출)</option>
              {programs.map((p) => (
                <option key={p.programId} value={p.programId}>{p.programNm} ({p.urlPath})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "2 1 160px" }}>
            <label className="adminLabel">상위 메뉴</label>
            <select
              className="adminSelect"
              style={{ width: "100%" }}
              value={newMenu.parentMenuId}
              onChange={(e) => setNewMenu((f) => ({ ...f, parentMenuId: e.target.value === "" ? "" : Number(e.target.value) }))}
            >
              <option value="">없음 (최상위)</option>
              {menuRows.map(({ menu, depth }) => (
                <option key={menu.menuId} value={menu.menuId}>
                  {"  ".repeat(depth)}{depth > 0 ? "└ " : ""}{menu.menuNm}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: "0 1 80px" }}>
            <label className="adminLabel">순서</label>
            <input
              className="adminInput"
              type="number"
              value={newMenu.sortOrder}
              onChange={(e) => setNewMenu((f) => ({ ...f, sortOrder: e.target.value }))}
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
              <th>메뉴 이름</th>
              <th>연결 프로그램</th>
              <th>상위 메뉴</th>
              <th>순서</th>
              <th>사용여부</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {menuRows.map(({ menu: m, depth }) => {
              const isDirty = !!changes[m.menuId];
              const excluded = getDescendantIds(menus, m.menuId); // 자기 자신 + 하위메뉴는 상위메뉴로 선택 불가(순환 방지)
              // 아직 한 번도 수정 안 된 행은 등록자/등록일을 "최종수정" 자리에 대신 보여줌(등록도 최초의 터치로 취급)
              const lastEdit = m.uptDe ? { uptId: m.uptId, uptDe: m.uptDe } : { uptId: m.insId, uptDe: m.insDe };
              return (
                <tr key={m.menuId} className={isDirty ? "adminRowDirty" : ""}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: depth * 20 }}>
                      {depth > 0 && <span style={{ color: "var(--text-3)", flexShrink: 0 }}>└</span>}
                      <input
                        className={`adminInput${changes[m.menuId]?.menuNm !== undefined ? " dirty" : ""}`}
                        value={getVal(m.menuId, "menuNm", m.menuNm)}
                        onChange={(e) => handleChange(m.menuId, "menuNm", e.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[m.menuId]?.programId !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(m.menuId, "programId", m.programId) ?? ""}
                      onChange={(e) =>
                        handleChange(m.menuId, "programId", e.target.value === "" ? null : Number(e.target.value))
                      }
                    >
                      <option value="">없음 (그룹 전용)</option>
                      {programs.map((p) => (
                        <option key={p.programId} value={p.programId}>{p.programNm} ({p.urlPath})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[m.menuId]?.parentMenuId !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(m.menuId, "parentMenuId", m.parentMenuId) ?? ""}
                      onChange={(e) => handleChange(m.menuId, "parentMenuId", e.target.value === "" ? null : Number(e.target.value))}
                    >
                      <option value="">없음 (최상위)</option>
                      {menuRows
                        .filter(({ menu: x }) => !excluded.has(x.menuId))
                        .map(({ menu: x, depth: d }) => (
                          <option key={x.menuId} value={x.menuId}>
                            {"  ".repeat(d)}{d > 0 ? "└ " : ""}{x.menuNm}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={`adminInput${changes[m.menuId]?.sortOrder !== undefined ? " dirty" : ""}`}
                      type="number"
                      style={{ width: 70 }}
                      value={getVal(m.menuId, "sortOrder", m.sortOrder)}
                      onChange={(e) => handleChange(m.menuId, "sortOrder", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[m.menuId]?.useYn !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(m.menuId, "useYn", m.useYn)}
                      onChange={(e) => handleChange(m.menuId, "useYn", e.target.value)}
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="adminCellEmail">{lastEdit.uptId ?? "-"}</td>
                  <td className="adminCellEmail">{lastEdit.uptDe ? formatRoundTime(lastEdit.uptDe) : "-"}</td>
                  <td>
                    <button className="btnDanger" onClick={() => handleDelete(m.menuId)}>삭제</button>
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
