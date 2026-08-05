import { ReactNode } from "react";

/**
 * 페이지 최상단 틀 컴포넌트 — styles/layout.css 의 .pageWrap(/.pageWrapWide)+.pageHeader+.pageTitle+.pageSubtitle 과
 * styles/admin.css 의 .adminPageHeader 를 variant prop 하나로 골라 쓸 수 있게 감싼 것.
 * 페이지 전체를 감싸는 최상위 div(pageWrap) 역할까지 함께 하므로 children 으로 나머지 페이지 내용을 넘겨받음.
 *
 * 사용 예:
 *   <PageHeader title="마이페이지" subtitle="계정 정보와 예매 내역을 확인합니다.">
 *     ...나머지 페이지 내용...
 *   </PageHeader>
 *
 *   <PageHeader
 *     variant="admin"
 *     title="공연 관리"
 *     subtitle="공연을 수정하거나 삭제합니다."
 *     actions={<Button variant="primary" onClick={...}>+ 공연 추가</Button>}
 *   >
 *     ...나머지 페이지 내용...
 *   </PageHeader>
 *
 * CSS 값은 전혀 바꾸지 않음 — 기존 className 문자열을 그대로 조립해서 붙여주기만 함.
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
