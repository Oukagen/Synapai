import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Fetch articles from Supabase
  const { data: posts, error } = await supabase
    .from("articles")
    .select("slug, title, date, description, content")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) {
    console.error("RSS error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }

  const siteUrl = "https://tuchujianbao.netlify.app";
  const siteTitle = "Synapai - 突触简报";
  const siteDescription = "AI行业资讯与深度报道";

  const items = (posts || []).map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${encodeURIComponent(post.slug)}</link>
      <guid>${siteUrl}/posts/${encodeURIComponent(post.slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description || ""}]]></description>
      <content:encoded><![CDATA[${post.content || ""}]]></content:encoded>
    </item>
  `).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}