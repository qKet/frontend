import { HTMLAttributes, ReactNode } from "react";

/**
 * 로딩/에러/성공 안내 문구 컴포넌트 — styles/message.css 의 .loadingMsg/.errorMsg/.successMsg 를
 * variant prop 하나로 골라 쓸 수 있게 감싼 것.
 *
 * 사용 예:
 *   <StatusMessage variant="loading">불러오는 중...</StatusMessage>
 *   {error && <StatusMessage variant="error">{error}</StatusMessage>}
 *   <StatusMessage variant={msg.ok ? "success" : "error"}>{msg.text}</StatusMessage>
 *
 * 기본 태그는 <p> — 인라인 배치(예: 버튼 옆) 등 <p>의 기본 여백이 레이아웃을 깨는 자리에서는
 * as="span" 으로 바꿔 쓸 수 있음.
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
 */

type StatusMessageVariant = "loading" | "error" | "success";

type StatusMessageProps = Omit<HTMLAttributes<HTMLElement>, "className"> & {
  variant: StatusMessageVariant;
  /** 렌더링할 태그. 기본값 "p" */
  as?: "p" | "span";
  className?: string;
  children: ReactNode;
};

const VARIANT_CLASS: Record<StatusMessageVariant, string> = {
  loading: "loadingMsg",
  error: "errorMsg",
  success: "successMsg",
};

export default function StatusMessage({
  variant,
  as: Tag = "p",
  className,
  children,
  ...rest
}: StatusMessageProps) {
  const classes = [VARIANT_CLASS[variant], className ?? ""].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
