"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordResetCode } from "@/lib/api/auth";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

export default function FindPasswordPage() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!userId || !userEmail) {
      setError("아이디와 이메일을 입력하세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await requestPasswordResetCode(userId, userEmail);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "링크 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authBox">
        <p className="authLogo">Q-Ket</p>
        <h1 className="authTitle">비밀번호 찾기</h1>

        {sent ? (
          <>
            <p className="authDesc">이메일로 비밀번호 재설정 링크를 보냈습니다.</p>
            <StatusMessage variant="success">
              메일함에서 링크를 눌러 새 비밀번호를 설정해 주세요. 링크는 15분간 유효합니다.
            </StatusMessage>
          </>
        ) : (
          <>
            <p className="authDesc">가입 시 등록한 아이디와 이메일을 입력하세요.</p>

            <FormField label="아이디">
              <Input
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </FormField>

            <FormField label="이메일">
              <Input
                type="email"
                placeholder="example@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
              />
            </FormField>

            {error && <StatusMessage variant="error">{error}</StatusMessage>}

            <Button variant="primary" fullWidth onClick={handleRequestCode} disabled={loading}>
              {loading ? "전송 중..." : "재설정 링크 받기"}
            </Button>
          </>
        )}

        <p className="authHelper">
          <Link href="/login">로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
