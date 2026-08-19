import "./globals.css";
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import { AuthProvider } from "@/context/AuthContext";
import FaroInit from "@/components/FaroInit";

export const metadata: Metadata = {
  title: "Q-Ket",
  description: "공연·행사 온라인 예매 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">

      <body>
        <FaroInit />
        <AuthProvider>
          <SiteNav />
          {children}
        </AuthProvider>
      </body>

    </html>
  );
}
