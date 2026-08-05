"use client";

import { ButtonHTMLAttributes } from "react";

/**
 * 공통 버튼 컴포넌트 — styles/button.css 의 4가지 스타일(Primary/Secondary/Ghost/Danger)을
 * variant prop 하나로 골라 쓸 수 있게 감싼 것. className을 직접 타이핑할 필요가 없어짐.
 *
 * 사용 예:
 *   <Button variant="primary" onClick={handleBook}>예매하기</Button>
 *   <Button variant="danger" onClick={handleDelete}>삭제</Button>
 *   <Button variant="primary" fullWidth type="submit">가입하기</Button>
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
 */

/*
* 이름은 UI 디자인에서 사용하는 이름이라고 해서 이렇게 지어봤슴둥
* primary = 이 화면에서 가장 하고싶은 핵심 행동으로 화면당 1개정도만 (보라색배경) (예시 : 예매하기, 회원가입/로그인 제출, 공연 등록)
* secondary = 있으면 좋지만 핵심은 아닌 보조행동 (회색배경) (예시 : 수정, 닫기, 회차 추가 버튼)
* ghost = 배경색이 아예 없고 테두리만 있음 (예시 : 대기열 페이지에서 나가기 정도??)
* danger = 되돌리기 어렵거나 영향이 큰 행동 (예시 : 삭제, 예매취소)
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
