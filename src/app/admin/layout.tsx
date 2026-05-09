import "../globals.css";

export const metadata = {
  title: "管理后台 - Synapai",
  description: "文章管理后台",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}