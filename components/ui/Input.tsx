import { InputHTMLAttributes, forwardRef } from "react";

/**
 * 공통 입력창 — styles/auth.css의 .fieldInput과 styles/admin.css의 .adminInput을 variant prop으로
 * 골라 쓰게 감싼 것. ref 전달 필요(관리자 폼에서 유효성 검사 실패 시 focus 이동에 사용).
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
