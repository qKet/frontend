import { TextareaHTMLAttributes, forwardRef } from "react";

/**
 * 공통 여러줄 입력창 컴포넌트 — Input.tsx 와 동일한 variant 조립 패턴.
 * 지금은 감상평 작성용(auth 톤의 fieldTextarea)만 필요해서 variant는 하나뿐이지만,
 * 나중에 다른 톤이 필요해지면 Input.tsx 처럼 VARIANT_CLASS 맵을 늘리면 됨.
 */

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...rest },
  ref
) {
  const classes = ["fieldTextarea", className ?? ""].filter(Boolean).join(" ");

  return <textarea ref={ref} className={classes} {...rest} />;
});

export default Textarea;
