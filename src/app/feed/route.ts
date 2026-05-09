import { NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");

function getAllPosts() {
  if (!fs.existsSync(postsDir)) return [];

  const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));

  return files.map((file: string) => {
    const fullPath = path.join(postsDir, file);
    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    return {
      slug: file.replace(/\.md$/, ""),
      title: data.title || "",
      date: data.date || "",
      category: data.category || "",
      description: data.description || "",
      content: content,
    };
  }).sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function GET() {
  const posts = getAllPosts();

  const siteUrl = "http://localhost:3000";
  const siteTitle = "Synapai - 突触简报";
  const siteDescription = "AI行业资讯与深度报道";

  const items = posts.map((post: { title: string; slug: string; date: string; description: string; content: string }) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${encodeURIComponent(post.slug)}</link>
      <guid>${siteUrl}/posts/${encodeURIComponent(post.slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
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