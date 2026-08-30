"use client";

// 홈 화면(app/page.tsx) 검색창 — 클라이언트 컴포넌트로 분리한 이유: 순수 <form method="GET">은
// 제출 시 페이지 전체를 하드 리로드하므로, useRouter().push()로 소프트 네비게이션(URL은 동일하게 유지).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type SearchBarProps = {
  defaultValue?: string;
  categoryId?: number;
};

export default function SearchBar({ defaultValue, categoryId }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  // useState(defaultValue)는 최초 마운트 시에만 초기화돼서, 같은 라우트 안에서 defaultValue(URL의
  // keyword)가 바뀌어도 검색창 텍스트가 안 따라가는 불일치가 있었음 — 값이 바뀔 때마다 동기화.
  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

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
