import { CSSProperties, ReactNode } from "react";

/**
 * 라벨 + 입력창 한 세트를 감싸는 공통 컴포넌트 — styles/auth.css의 .field/.fieldLabel과
 * styles/admin.css의 .adminFormRow/.adminLabel을 variant prop으로 골라 쓰게 감싼 것.
 * 입력창은 children으로 그대로 넘겨받음(Input 컴포넌트가 아니어도 됨).
 */

type FormFieldVariant = "auth" | "admin";

type FormFieldProps = {
  /** auth = 로그인/회원가입 폼(field/fieldLabel), admin = 관리자 폼(adminFormRow/adminLabel). 기본값 auth */
  variant?: FormFieldVariant;
  label: ReactNode;
  /** 라벨 옆에 필수 입력 표시(*) — admin.css 의 .adminRequired 사용 */
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const WRAP_CLASS: Record<FormFieldVariant, string> = {
  auth: "field",
  admin: "adminFormRow",
};

const LABEL_CLASS: Record<FormFieldVariant, string> = {
  auth: "fieldLabel",
  admin: "adminLabel",
};

export default function FormField({
  variant = "auth",
  label,
  required = false,
  className,
  style,
  children,
}: FormFieldProps) {
  const wrapClasses = [WRAP_CLASS[variant], className ?? ""].filter(Boolean).join(" ");

  return (
    <div className={wrapClasses} style={style}>
      <label className={LABEL_CLASS[variant]}>
        {label}
        {required && (
          <>
            {" "}
            <span className="adminRequired">*</span>
          </>
        )}
      </label>
      {children}
    </div>
  );
}
