import { InputHTMLAttributes, forwardRef } from "react";

/**
 * 공통 입력창 컴포넌트 — styles/auth.css 의 .fieldInput 과 styles/admin.css 의 .adminInput 을
 * variant prop 하나로 골라 쓸 수 있게 감싼 것.
 *
 * 사용 예:
 *   <Input placeholder="아이디를 입력하세요" value={userId} onChange={...} />        (variant 기본값 auth)
 *   <Input variant="admin" value={editTitle} onChange={...} ref={editTitleRef} />
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
 * ref 전달 필요 (관리자 폼에서 유효성 검사 실패 시 focus 이동에 사용).
 */

type InputVariant = "auth" | "admin";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** auth = 로그인/회원가입 입력창(fieldInput), admin = 관리자 폼 입력창(adminInput). 기본값 auth */
  variant?: InputVariant;
};

const VARIANT_CLASS: Record<InputVariant, string> = {
  auth: "fieldInput",
  admin: "adminInput",
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "auth", className, ...rest },
  ref
) {
  const classes = [VARIANT_CLASS[variant], className ?? ""].filter(Boolean).join(" ");

  return <input ref={ref} className={classes} {...rest} />;
});

export default Input;
