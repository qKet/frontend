"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import {
  getAdminUsers,
  getRoles,
  batchUpdateUsers,
  type AdminUser,
  type Role,
} from "@/lib/api/admin";
import { formatRoundTime } from "@/lib/utils/datetime";

type RowChange = { roleId?: number; userStatus?: string };

export default function AdminUsersPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // userId → 변경된 값
  const [changes, setChanges] = useState<Record<string, RowChange>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    Promise.all([getAdminUsers(), getRoles()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const changeCount = Object.keys(changes).length;

  const handleChange = (userId: string, field: keyof RowChange, value: string | number) => {
    setChanges(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
    setMsg("");
  };

  const getVal = <K extends keyof RowChange>(
    userId: string,
    field: K,
    original: RowChange[K]
  ): RowChange[K] => changes[userId]?.[field] ?? original;

  const handleSave = async () => {
    if (changeCount === 0) return;
    setSaving(true);
    setMsg("");
    try {
      await batchUpdateUsers(changes);
      // 저장 후 서버에서 다시 조회 — 로컬 값만 낙관적으로 합치면 uptId/uptDe(최종수정자/수정일)처럼
      // 서버가 계산해서 새로 채워주는 값은 반영이 안 됨(프로그램/메뉴 관리 화면과 동일하게 재조회로 통일)
      setUsers(await getAdminUsers());
      setChanges({});
      setMsg(`${changeCount}건이 저장되었습니다.`);
    } catch {
      setMsg("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><StatusMessage variant="loading">불러오는 중...</StatusMessage></div>;

  return (
    <PageHeader
      variant="admin"
      title="사용자 관리"
      subtitle="역할과 상태를 수정한 뒤 저장 버튼을 누르세요."
      actions={
        <div className="adminHeaderActions">
          {msg && (
            <StatusMessage as="span" variant={msg.includes("실패") ? "error" : "success"} style={{ margin: 0 }}>
              {msg}
            </StatusMessage>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || changeCount === 0}
          >
            {saving ? "저장 중..." : changeCount > 0 ? `저장 (${changeCount}건)` : "저장"}
          </Button>
        </div>
      }
    >
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>아이디</th>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>최종수정자</th>
              <th>최종수정일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isDirty = !!changes[user.userId];
              return (
                <tr key={user.userId} className={isDirty ? "adminRowDirty" : ""}>
                  <td className="adminCellId">{user.userId}</td>
                  <td>{user.userNm}</td>
                  <td className="adminCellEmail">{user.userEmail}</td>
                  <td>
                    <select
                      className={`adminSelect${changes[user.userId]?.roleId !== undefined ? " dirty" : ""}`}
                      value={getVal(user.userId, "roleId", user.roleId)}
                      onChange={e => handleChange(user.userId, "roleId", Number(e.target.value))}
                    >
                      {roles.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[user.userId]?.userStatus !== undefined ? " dirty" : ""}`}
                      value={getVal(user.userId, "userStatus", user.userStatus)}
                      onChange={e => handleChange(user.userId, "userStatus", e.target.value)}
                    >
                      <option value="ACTIVE">사용중</option>
                      <option value="SUSPENDED">정지됨</option>
                    </select>
                  </td>
                  <td className="adminCellEmail">{user.uptId ?? "-"}</td>
                  <td className="adminCellEmail">{user.uptDe ? formatRoundTime(user.uptDe) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
