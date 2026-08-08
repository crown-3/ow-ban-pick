import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});

export const metadata: Metadata = {
  title: "오버워치 친선전 밴픽 공유",
  description: "친선전 밴픽 룰을 링크 하나로 함께 정하는 도구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
