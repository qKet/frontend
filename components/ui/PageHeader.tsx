import { ReactNode } from "react";

/**
 * 페이지 최상단 틀 컴포넌트 — styles/layout.css의 .pageWrap+.pageHeader+.pageTitle+.pageSubtitle과
 * styles/admin.css의 .adminPageHeader를 variant prop으로 골라 쓰게 감싼 것. pageWrap 역할까지
 * 겸하므로 children으로 나머지 페이지 내용을 넘겨받음. CSS 값은 안 바꾸고 className만 조립.
 */

type PageHeaderVariant = "default" | "admin";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** default = 일반 페이지(pageHeader), admin = 관리자 페이지(adminPageHeader, 우측 actions 슬롯 포함). 기본값 default */
  variant?: PageHeaderVariant;
  /** pageWrapWide 적용 — 좌석 선택처럼 폭이 넓어야 하는 페이지용 */
  wide?: boolean;
  /** variant="admin"일 때 헤더 우측에 배치할 버튼/영역 (adminHeaderActions 래핑 여부는 호출부에서 결정) */
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  variant = "default",
  wide = false,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className={wide ? "pageWrapWide" : "pageWrap"}>
      {variant === "admin" ? (
        <div className="adminPageHeader">
          <div>
            <h1 className="pageTitle">{title}</h1>
            {subtitle && <p className="pageSubtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      ) : (
        <div className="pageHeader">
          <h1 className="pageTitle">{title}</h1>
          {subtitle && <p className="pageSubtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
