import Link from "next/link";

/**
 * 번호 페이지네이션 컴포넌트 — styles/card.css 의 pagination 관련 클래스를 감싼 것.
 * 서버 컴포넌트(app/page.tsx 등)에서 그대로 쓸 수 있게 <Link> 기반으로만 구성 (클라이언트 상태 없음).
 *
 * 사용 예:
 *   <Pagination page={page} totalPages={totalPages} basePath="/" />
 */

type PaginationProps = {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  totalPages: number;
  /** 페이지 번호를 붙일 기준 경로. 기본값 "/" */
  basePath?: string;
  /** page 파라미터와 함께 유지할 추가 쿼리 (예: 카테고리 필터) */
  extraQuery?: Record<string, string | number | undefined>;
};

export default function Pagination({ page, totalPages, basePath = "/", extraQuery }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const prevPage = Math.max(page - 1, 1);
  const nextPage = Math.min(page + 1, totalPages);

  const extra = Object.entries(extraQuery ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}&`)
    .join("");

  const hrefFor = (p: number) => `${basePath}?${extra}page=${p}`;

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <Link
        href={hrefFor(prevPage)}
        className={`paginationArrow${page <= 1 ? " paginationDisabled" : ""}`}
      >
        이전
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`paginationItem${p === page ? " paginationItemActive" : ""}`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={hrefFor(nextPage)}
        className={`paginationArrow${page >= totalPages ? " paginationDisabled" : ""}`}
      >
        다음
      </Link>
    </nav>
  );
}
