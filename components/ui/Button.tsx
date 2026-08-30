"use client";

import { ButtonHTMLAttributes } from "react";

/**
 * 공통 버튼 — styles/button.css의 4가지 스타일을 variant prop으로 골라 쓰게 감싼 것.
 * primary=핵심 행동(화면당 1개, 예매하기/제출), secondary=보조 행동(수정/닫기),
 * ghost=테두리만(나가기 등), danger=되돌리기 어려운 행동(삭제/예매취소).
 */
type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 버튼 색상/스타일 종류. 기본값 primary */
  variant?: Variant;
  /** btnPrimaryFull 적용 — variant="primary"일 때만 의미 있음 (가로 100%, 폼 제출 버튼 등) */
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btnPrimary",
  secondary: "btnSecondary",
  ghost: "btnGhost",
  danger: "btnDanger",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    VARIANT_CLASS[variant],
    fullWidth && variant === "primary" ? "btnPrimaryFull" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
