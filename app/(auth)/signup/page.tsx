"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api/auth"
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

export default function SignupPage() {
  const router = useRouter();

  // 입력값 상태
  const [userId, setUserId] = useState("");
  const [userNm, setUserNm] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");

  // UI 상태
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);




  const handlSignup = async () => {
    // 모든 필드값 작성했는지 유효성 검사
    if (!userId || !userNm || !userEmail || !pwd || !pwdConfirm) {
      setError("모든 항목을 입력하세요.");
      return;
    }

    // 비밀번호 확인 유효성
    if (pwd !== pwdConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    //추후에 ID 중복확인 체킹 넣을지 말지 선택
    setLoading(true);
    setError("");

    try {
      await signup(userId, userNm, userEmail, pwd);
      //signup 성공 시 sessionStorage 에 id값 임시 저장하여 "/login" 페이지에 userId값에 적용
      sessionStorage.setItem("prefillUserId", userId);
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="authWrap">
      <div className="authBox">
        <p className="authLogo">TicketBox</p>
        <h1 className="authTitle">회원가입</h1>
        <p className="authDesc">새 계정을 만들어 공연을 예매하세요.</p>

        <FormField label="아이디">
          <Input
            placeholder="사용할 아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </FormField>

        <FormField label="이름">
          <Input
            placeholder="실명을 입력하세요"
            value={userNm}
            onChange={(e) => setUserNm(e.target.value)}
          />
        </FormField>

        <FormField label="이메일">
          <Input
            type="email"
            placeholder="example@email.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </FormField>

        <FormField label="비밀번호">
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </FormField>

        <FormField label="비밀번호 확인">
          <Input
            type="password"
            placeholder="비밀번호 재입력"
            value={pwdConfirm}
            onChange={(e) => setPwdConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlSignup()}
          />
        </FormField>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <Button
          variant="primary"
          fullWidth
          // 버튼클릭시 생성
          onClick={handlSignup}
          disabled={loading}
        >
          {loading ? "처리 중..." : "가입하기"}
        </Button>

        <p className="authHelper">
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
