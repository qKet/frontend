import { HTMLAttributes, ReactNode } from "react";

/**
 * 로딩/에러/성공 안내 문구 — styles/message.css의 .loadingMsg/.errorMsg/.successMsg를 variant
 * prop으로 골라 쓰게 감싼 것. 기본 태그는 <p>, 인라인 배치가 필요하면 as="span"으로 전환.
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
