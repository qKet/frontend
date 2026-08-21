"use client";

// 홈 화면(app/page.tsx) 검색창 — 클라이언트 컴포넌트로 분리한 이유:
// 순수 <form method="GET">은 제출할 때 브라우저가 페이지 전체를 하드 리로드해서
// 카테고리 칩(<Link>, 소프트 네비게이션)과 달리 화면이 깜빡이고 이미지도 다시 로드됨.
// useRouter().push()로 이동하면 URL은 동일하게 남으면서(공유 가능한 링크 유지) 소프트 네비게이션이 됨.

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

  // useState(defaultValue)는 최초 마운트 시 한 번만 초기화되고 이후 defaultValue가 바뀌어도
  // 안 따라감 — 로그아웃 등으로 keyword 없는 "/"로 이동해도(같은 라우트라 리마운트 안 됨)
  // 검색창엔 예전 텍스트가 남아있는데 목록 필터는 풀려버리는 불일치가 있었음(2026-08-21).
  // defaultValue(URL의 keyword)가 바뀔 때마다 입력값을 그 값으로 동기화해서 항상 실제 필터
  // 상태와 검색창 텍스트가 일치하게 함.
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
