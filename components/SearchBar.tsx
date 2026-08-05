"use client";

// 홈 화면(app/page.tsx) 검색창 — 클라이언트 컴포넌트로 분리한 이유:
// 순수 <form method="GET">은 제출할 때 브라우저가 페이지 전체를 하드 리로드해서
// 카테고리 칩(<Link>, 소프트 네비게이션)과 달리 화면이 깜빡이고 이미지도 다시 로드됨.
// useRouter().push()로 이동하면 URL은 동일하게 남으면서(공유 가능한 링크 유지) 소프트 네비게이션이 됨.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type SearchBarProps = {
  defaultValue?: string;
  categoryId?: number;
};

export default function SearchBar({ defaultValue, categoryId }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (categoryId != null) params.set("categoryId", String(categoryId));
    const trimmed = value.trim();
    if (trimmed) params.set("keyword", trimmed);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <form onSubmit={handleSubmit} className="searchBar">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="공연 제목 또는 공연장으로 검색"
        className="searchInput"
      />
      <Button type="submit" variant="primary">검색</Button>
    </form>
  );
}
