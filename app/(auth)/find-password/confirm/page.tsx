"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api/auth";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

function ConfirmForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPwd || !newPwdConfirm) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    if (newPwd !== newPwdConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(token!, newPwd);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authBox">
        <p className="authLogo">Q-Ket</p>
        <h1 className="authTitle">비밀번호 재설정</h1>

        {!token ? (
          <>
            <p className="authDesc">유효하지 않은 링크입니다.</p>
            <StatusMessage variant="error">
              링크가 잘못됐거나 만료됐어요. 비밀번호 찾기를 다시 시도해 주세요.
            </StatusMessage>
          </>
        ) : done ? (
          <>
            <p className="authDesc">비밀번호 재설정이 완료됐어요.</p>
            <StatusMessage variant="success">새 비밀번호로 로그인해 주세요.</StatusMessage>
            <Button variant="primary" fullWidth onClick={() => router.push("/login")}>
              로그인하러 가기
            </Button>
          </>
        ) : (
          <>
            <p className="authDesc">새 비밀번호를 입력하세요.</p>

            <FormField label="새 비밀번호">
              <Input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </FormField>

            <FormField label="새 비밀번호 확인">
              <Input
                type="password"
                placeholder="새 비밀번호 재입력"
                value={newPwdConfirm}
                onChange={(e) => setNewPwdConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              />
            </FormField>

            {error && <StatusMessage variant="error">{error}</StatusMessage>}

            <Button variant="primary" fullWidth onClick={handleResetPassword} disabled={loading}>
              {loading ? "처리 중..." : "비밀번호 재설정"}
            </Button>
          </>
        )}

        {!done && (
          <p className="authHelper">
            <Link href="/login">로그인으로 돌아가기</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPasswordResetPage() {
  return (
    <Suspense>
      <ConfirmForm />
    </Suspense>
  );
}
