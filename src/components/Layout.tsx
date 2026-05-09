import Link from "next/link";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#131313]">
      <Header />
      <main className="pt-14">{children}</main>
      <footer className="bg-[#0A0A0A] border-t border-[#262626]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/Logo.png" alt="Synapai" className="w-8 h-8" />
                <span className="text-lg font-semibold text-white">Synapai</span>
              </div>
              <p className="text-sm text-[#737373] max-w-xs font-body">
                突触简报，专注于AI行业的垂直资讯平台。
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-3">
              <div>
                <h4 className="section-label mb-3">分类</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/?category=tech-giants" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      大厂动态
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=industry-pulse" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      行业脉搏
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=model-tracking" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      模型追踪
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=tool-unboxing" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      工具开箱
                    </Link>
                  </li>
                  <li>
                    <Link href="/?category=hot-tools" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      热门skill
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="section-label mb-3">关于</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/feed" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      RSS 订阅
                    </a>
                  </li>
                  <li>
                    <a href="/posts.json" className="text-sm text-[#737373] hover:text-accent transition-colors">
                      数据接口
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-6 border-t border-[#262626]">
            <p className="text-xs text-[#525252] font-mono">
              © 2026 Synapai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
