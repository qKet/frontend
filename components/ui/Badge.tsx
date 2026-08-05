import { HTMLAttributes } from "react";

/**
 * 상태/등급 뱃지 컴포넌트 — styles/badge.css 의 6가지 색상(Open/Closed/Soldout/Vip/R/S)을
 * variant prop 하나로 골라 쓸 수 있게 감싼 것.
 *
 * 사용 예:
 *   <Badge variant="closed">예매 마감</Badge>
 *   <Badge variant="soldout">매진</Badge>
 *   <Badge variant="vip">VIP석</Badge>
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
 *
 * variant 뜻:
 * open    = 예매 가능 (초록)       — 공연 목록의 "예매 가능" 상태
 * closed  = 예매 종료/마감 (회색)  — "예매 전", "예매 마감", 취소된 예매 등
 * soldout = 매진 (빨강)            — 회차가 매진된 경우
 * vip/r/s = 좌석 등급 색상         — 좌석 선택 화면의 등급 표시
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
