"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signup, sendEmailVerificationCode, confirmEmailVerificationCode } from "@/lib/api/auth"
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import StatusMessage from "@/components/ui/StatusMessage";

const CODE_TTL_SEC = 300; // 5분 — 백엔드 EmailVerificationServiceImpl의 CODE_TTL과 동일
// 백엔드 EmailVerificationServiceImpl의 EMAIL_PATTERN과 동일 — 명백히 잘못된 형식은 요청 전에 걸러서
// 발송 시도 없이 바로 에러를 보여줌(네트워크 왕복 없이 즉시 피드백)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // 이메일 인증 상태
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [remainingSec, setRemainingSec] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  // QueueModal.tsx의 useRef(interval id) + useEffect cleanup 패턴 재사용
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCountdown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemainingSec(CODE_TTL_SEC);
    intervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (cancelledRef.current) return prev;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!userEmail) {
      setEmailError("이메일을 입력하세요.");
      return;
    }
    if (!EMAIL_PATTERN.test(userEmail)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setSendingCode(true);
    setEmailError("");
    try {
      await sendEmailVerificationCode(userEmail);
      setEmailSent(true);
      setEmailVerified(false);
      setVerifyCode("");
      startCountdown();
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    setEmailError("");
    try {
      await confirmEmailVerificationCode(userEmail, verifyCode);
      setEmailVerified(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "인증번호가 올바르지 않습니다.");
    }
  };

  const formatRemaining = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

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

    if (!emailVerified) {
      setError("이메일 인증을 완료해주세요.");
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
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              type="email"
              placeholder="example@email.com"
              value={userEmail}
              disabled={emailVerified}
              onChange={(e) => {
                setUserEmail(e.target.value);
                setEmailVerified(false);
                setEmailSent(false);
              }}
            />
            <Button
              variant="secondary"
              type="button"
              disabled={sendingCode || emailVerified || remainingSec > 0}
              onClick={handleSendCode}
            >
              {emailVerified ? "인증완료" : remainingSec > 0 ? "재전송 대기" : emailSent ? "재전송" : "인증번호 발송"}
            </Button>
          </div>
        </FormField>

        {emailSent && !emailVerified && (
          <FormField label="인증번호">
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Input
                placeholder="6자리 인증번호"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
              />
              <Button variant="secondary" type="button" onClick={handleConfirmCode}>확인</Button>
              {remainingSec > 0 && <span style={{ fontSize: "var(--font-sm)", whiteSpace: "nowrap" }}>{formatRemaining(remainingSec)}</span>}
            </div>
          </FormField>
        )}

        {emailError && <StatusMessage variant="error">{emailError}</StatusMessage>}

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
