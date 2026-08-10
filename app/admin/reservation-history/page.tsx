"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import {
  getReservationHistory,
  type ReservationHistoryLog,
} from "@/lib/api/admin";
import { formatRoundTime } from "@/lib/utils/datetime";

// 기본 기간: 최근 7일 (YYYY-MM-DD)
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

const ACTION_LABEL: Record<string, string> = { RESERVED: "예매", CANCELLED: "취소" };

export default function AdminReservationHistoryPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [from, setFrom] = useState(toDateInput(weekAgo));
  const [to, setTo] = useState(toDateInput(today));
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState<"" | "RESERVED" | "CANCELLED">("");

  const [logs, setLogs] = useState<ReservationHistoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = () => {
    setLoading(true);
    setError("");
    getReservationHistory({ from, to, userId: userId || undefined, action: action || undefined })
      .then(setLogs)
      .catch(() => setError("조회에 실패했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userSession]);

  if (isLoading) {
    return <div className="pageWrap"><StatusMessage variant="loading">불러오는 중...</StatusMessage></div>;
  }

  return (
    <PageHeader
      variant="admin"
      title="예매 활동 로그"
      subtitle="기간·사용자·예매/취소 여부로 예매 활동 이력을 조회합니다."
    >
      <div className="adminCard">
        <div className="adminFilterBar">
          <div className="adminFormRow">
            <span className="adminLabel">시작일</span>
            <input type="date" className="adminInput" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="adminFormRow">
            <span className="adminLabel">종료일</span>
            <input type="date" className="adminInput" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="adminFormRow">
            <span className="adminLabel">사용자 아이디</span>
            <input
              type="text"
              className="adminInput"
              placeholder="전체"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>
          <div className="adminFormRow">
            <span className="adminLabel">구분</span>
            <select className="adminSelect" value={action} onChange={e => setAction(e.target.value as typeof action)}>
              <option value="">전체</option>
              <option value="RESERVED">예매</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <Button variant="primary" onClick={search} disabled={loading}>
            {loading ? "조회 중..." : "조회"}
          </Button>
        </div>
      </div>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      {!loading && !error && logs.length === 0 ? (
        <p className="emptyMsg">조건에 해당하는 활동 내역이 없습니다.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>일시</th>
                <th>구분</th>
                <th>사용자</th>
                <th>공연</th>
                <th>회차</th>
                <th>좌석</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.historyId}>
                  <td>{formatRoundTime(log.createdReserved)}</td>
                  <td>{ACTION_LABEL[log.reservedStatus] ?? log.reservedStatus}</td>
                  <td className="adminCellId">{log.userId}</td>
                  <td>{log.pTitle}</td>
                  <td>{formatRoundTime(log.roundTime)}</td>
                  <td>{log.seatRow}{log.seatColume} ({log.grade})</td>
                  <td className="adminCellEmail">{log.insIp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageHeader>
  );
}
