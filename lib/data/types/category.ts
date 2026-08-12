// 공연 카테고리 — 홈 화면 카테고리 필터, 공연 등록/수정 폼의 카테고리 선택에 사용
export type Category = {
  categoryId: number;
  categoryNm: string;
  sortOrder: number;
  useYn: "Y" | "N";
  insId?: string | null;
  insDe?: string | null;
  uptId?: string | null;
  uptDe?: string | null;
};
