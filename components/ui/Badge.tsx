import { HTMLAttributes } from "react";

/**
 * 상태/등급 뱃지 — styles/badge.css의 6가지 색상(Open/Closed/Soldout/Vip/R/S)을 variant prop으로
 * 골라 쓰게 감싼 것. open=예매 가능(초록), closed=예매 종료/마감(회색), soldout=매진(빨강),
 * vip/r/s=좌석 등급 색상.
 */

type BadgeVariant = "open" | "closed" | "soldout" | "vip" | "r" | "s";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant: BadgeVariant;
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  open: "badgeOpen",
  closed: "badgeClosed",
  soldout: "badgeSoldout",
  vip: "badgeVip",
  r: "badgeR",
  s: "badgeS",
};

export default function Badge({ variant, className, children, ...rest }: BadgeProps) {
  const classes = ["badge", VARIANT_CLASS[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
