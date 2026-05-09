import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Synapai - 突触简报",
  description: "AI行业资讯与深度报道",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
