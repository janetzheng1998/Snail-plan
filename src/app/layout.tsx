import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body"
});

const titleFont = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-title"
});

export const metadata: Metadata = {
  title: "AI 成长计划与复盘助手",
  description: "将语音/文字输入整理成结构化计划、复盘与成长轨迹的前端原型"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${bodyFont.variable} ${titleFont.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
