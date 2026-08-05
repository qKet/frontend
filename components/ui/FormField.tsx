import { CSSProperties, ReactNode } from "react";

/**
 * 라벨 + 입력창 한 세트를 감싸는 공통 컴포넌트 — styles/auth.css 의 .field/.fieldLabel 과
 * styles/admin.css 의 .adminFormRow/.adminLabel 을 variant prop 하나로 골라 쓸 수 있게 감싼 것.
 * 실제 입력창(input/select 등)은 children 으로 그대로 넘겨받음 — Input 컴포넌트가 아니어도 됨.
 *
 * 사용 예:
 *   <FormField label="아이디">
 *     <Input value={userId} onChange={...} />
 *   </FormField>
 *   <FormField variant="admin" label="공연 제목" required>
 *     <Input variant="admin" ref={titleRef} value={editTitle} onChange={...} />
 *   </FormField>
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
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
