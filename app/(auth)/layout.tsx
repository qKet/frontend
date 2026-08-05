export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // 로그인/회원가입 페이지는 네비게이션 바 없이 표시
  return <>{children}</>;
}
