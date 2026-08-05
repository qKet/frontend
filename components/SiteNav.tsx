"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { getMyMenus } from "@/lib/api/common";
import type { MenuTreeNode } from "@/lib/data/types";
import { useAuth } from "@/context/AuthContext";

export default function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { userSession, setUserSession, isLoading } = useAuth();
  const [menus, setMenus] = useState<MenuTreeNode[]>([]);

  // 로그인한 사용자의 role이 접근 가능한 메뉴를 DB(PROGRAMS/ROLE_PROGRAMS/MENUS)에서 가져옴.
  // "공연" 홈 링크는 비로그인 상태에서도 보여야 해서 아래 JSX에 그대로 하드코딩 유지 —
  // 여기서 가져온 목록에서는 중복 노출을 막기 위해 urlPath === "/" 인 항목만 걸러냄
  useEffect(() => {
    if (!userSession) {
      setMenus([]);
      return;
    }
    getMyMenus()
      .then(setMenus)
      .catch(() => setMenus([]));
  }, [userSession]);

  // [TODO-NAV-LOGOUT] 로그아웃
  const handleLogout = async () => {
    await logout().catch(() => { });
    setUserSession(null);
    router.push("/");
  };

  // 결제 화면은 이탈을 줄이려고 네비를 숨긴다(결제창 UX 관례).
  // 대신 화면 안에 브랜드 표시 + "좌석 선택으로" 버튼을 따로 두므로 갇히지는 않음.
  // 훅 호출 순서가 깨지지 않도록 useEffect 아래에서 판단해야 함.
  if (pathname === "/payments/checkout") return null;

  return (
    <nav className="siteNav">
      <div className="siteNavInner">
        <Link href="/" className="siteNavBrand">Q-Ket</Link>
        {!isLoading && (
          <div className="siteNavLinks">
            <Link href="/" className={pathname === "/" ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
              공연
            </Link>
            {userSession ? (
              <>
                {menus
                  .filter((menu) => menu.urlPath !== "/")
                  .map((menu) => {
                    const isActive = menu.urlPath !== null && pathname.startsWith(menu.urlPath);
                    const hasChildren = menu.children.length > 0;

                    // 하위메뉴 없는 항목은 기존처럼 단순 링크
                    if (!hasChildren) {
                      if (menu.urlPath === null) return null; // 연결 페이지도, 하위메뉴도 없으면 보여줄 게 없음
                      return (
                        <Link
                          key={menu.menuId}
                          href={menu.urlPath}
                          className={isActive ? "siteNavLink siteNavLinkActive" : "siteNavLink"}
                        >
                          {menu.menuNm}
                        </Link>
                      );
                    }

                    // 하위메뉴가 있으면 마우스 호버 시 아래로 드롭다운 노출 (CSS :hover, siteNavItem:hover .siteNavDropdown)
                    const isGroupActive = isActive || menu.children.some((c) => c.urlPath !== null && pathname.startsWith(c.urlPath));
                    // urlPath가 없는 "그룹 전용" 메뉴는 클릭해서 갈 페이지가 없으므로 Link가 아니라
                    // 호버 트리거 역할만 하는 span으로 렌더링 (드롭다운은 동일하게 뜸)
                    const trigger =
                      menu.urlPath === null ? (
                        <span className={isGroupActive ? "siteNavLink siteNavLinkActive" : "siteNavLink"}>
                          {menu.menuNm}
                          <span className="siteNavCaret" />
                        </span>
                      ) : (
                        <Link
                          href={menu.urlPath}
                          className={isGroupActive ? "siteNavLink siteNavLinkActive" : "siteNavLink"}
                        >
                          {menu.menuNm}
                          <span className="siteNavCaret" />
                        </Link>
                      );

                    return (
                      <div key={menu.menuId} className="siteNavItem">
                        {trigger}
                        <div className="siteNavDropdown">
                          {menu.children
                            .slice()
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((child) => (
                              <Link
                                key={child.menuId}
                                href={child.urlPath ?? "#"}
                                className={
                                  child.urlPath !== null && pathname.startsWith(child.urlPath)
                                    ? "siteNavDropdownLink siteNavDropdownLinkActive"
                                    : "siteNavDropdownLink"
                                }
                              >
                                {child.menuNm}
                              </Link>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                <span className="siteNavUser">{userSession.userNm}님</span>
                <button className="siteNavLink siteNavLogout" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" className="siteNavLink siteNavLogin">
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
