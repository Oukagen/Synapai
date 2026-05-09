import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface DataSource {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  enabled: boolean;
}

// Simple test endpoint to verify configuration
export async function GET() {
  const hasApiKey = !!process.env.AUTOMATION_LLM_API_KEY;
  const hasEndpoint = !!process.env.AUTOMATION_LLM_ENDPOINT;

  return NextResponse.json({
    configured: hasApiKey && hasEndpoint,
    provider: process.env.AUTOMATION_LLM_PROVIDER || "not set",
    endpoint: process.env.AUTOMATION_LLM_ENDPOINT || "not set",
    model: process.env.AUTOMATION_LLM_MODEL || "not set",
    hasApiKey,
    hasEndpoint,
  });
}

// Fetch RSS feed
async function fetchRSS(url: string): Promise<{ title: string; link: string; description: string; pubDate: string }[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Synapai Bot)",
      },
    });
    const xml = await response.text();

    const isAtom = xml.includes("<feed") || xml.includes("<entry");
    const itemRegex = isAtom
      ? /<entry[^>]*>([\s\S]*?)<\/entry>/gi
      : /<item[^>]*>([\s\S]*?)<\/item>/gi;

    const items: { title: string; link: string; description: string; pubDate: string }[] = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      // Extract title
      let title = extractTag(itemXml, "title");
      if (!title) {
        const nameMatch = itemXml.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
        if (nameMatch) title = decodeHtml(nameMatch[1].trim());
      }

      // Extract link
      let link = extractTag(itemXml, "link");
      if (!link) {
        const linkMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
        if (linkMatch) link = decodeHtml(linkMatch[1]);
      }

      // Extract description
      const description = extractTag(itemXml, "description") ||
                          extractTag(itemXml, "summary") ||
                          extractTag(itemXml, "content");

      // Extract date
      const pubDate = extractTag(itemXml, "pubDate") ||
                      extractTag(itemXml, "published") ||
                      extractTag(itemXml, "updated");

      if (title && link) {
        items.push({ title, link, description: description || "", pubDate: pubDate || new Date().toISOString() });
      }
    }

    return items;
  } catch (error) {
    console.error("RSS fetch error:", error);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const whitespace = "[\\s\\S]";
  const regex = new RegExp("<" + tag + "[^>]*>([^<]*)<\/" + tag + ">", "i");
  const match = xml.match(regex);
  return match ? decodeHtml(match[1].trim()) : "";
}

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([a-f0-9]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

// Check if article already exists by URL
async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .eq("source_url", url)
    .maybeSingle();
  return !!data;
}

// Save article to Supabase
async function saveArticle(article: {
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  content: string;
  slug: string;
}): Promise<boolean> {
  const { error } = await supabase.from("articles").insert({
    slug: article.slug,
    title: article.title,
    date: article.date,
    category: article.category,
    source_url: article.source_url,
    description: article.description,
    cover_image: article.cover_image,
    is_featured: false,
    content: article.content,
  });

  if (error) {
    console.error("Save error:", error);
    return false;
  }
  return true;
}

// Generate article using LLM
async function generateArticle(content: string): Promise<{
  title: string;
  description: string;
  category: string;
  content: string;
} | null> {
  const endpoint = process.env.AUTOMATION_LLM_ENDPOINT;
  const apiKey = process.env.AUTOMATION_LLM_API_KEY;
  const model = process.env.AUTOMATION_LLM_MODEL;

  if (!endpoint || !apiKey) {
    throw new Error("LLM not configured");
  }

  const prompt = `请根据以下内容生成一篇突触简报的文章。

要求：
- 标题简洁有力，不超过30字
- 摘要100字以内，突出核心信息
- 分类：大厂动态、行业脉搏、模型追踪、工具开箱、热门skill
- 正文用Markdown格式

内容：
${content.slice(0, 3000)}

输出格式（严格按此格式）：
标题：
摘要：
分类：
正文：`;

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "auto",
        messages: [
          { role: "system", content: "你是一个专业的科技资讯编辑。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Parse response
    let title = "", description = "", category = "", body = "";
    let section = "";

    for (const line of text.split("\n")) {
      if (line.startsWith("标题：") || line.startsWith("标题:")) {
        title = line.replace(/^标题[：:]\s*/, "").trim();
        section = "title";
      } else if (line.startsWith("摘要：") || line.startsWith("摘要:")) {
        description = line.replace(/^摘要[：:]\s*/, "").trim();
        section = "desc";
      } else if (line.startsWith("分类：") || line.startsWith("分类:")) {
        category = line.replace(/^分类[：:]\s*/, "").trim();
        section = "cat";
      } else if (line.startsWith("正文：") || line.startsWith("正文:")) {
        body = line.replace(/^正文[：:]\s*/, "").trim();
        section = "body";
      } else if (section === "body") {
        body += "\n" + line;
      }
    }

    const catMap: Record<string, string> = {
      "大厂动态": "tech-giants",
      "行业脉搏": "industry-pulse",
      "模型追踪": "model-tracking",
      "工具开箱": "tool-unboxing",
      "热门skill": "hot-tools",
    };

    return {
      title: title || "无标题",
      description: description || "",
      category: catMap[category] || "tech-giants",
      content: body || content.slice(0, 500),
    };
  } catch (error: any) {
    console.error("LLM error:", error);
    throw error;
  }
}

// Convert URL to markdown using Jina
async function convertUrl(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error("Jina failed");
    return await response.text();
  } catch (error) {
    console.error("Jina error:", error);
    return "";
  }
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s一-鿿-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) || "article-" + Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSources } = body;

    // Check required env vars
    if (!process.env.AUTOMATION_LLM_API_KEY) {
      return NextResponse.json({ error: "未配置 AI API Key" }, { status: 400 });
    }
    if (!process.env.AUTOMATION_LLM_ENDPOINT) {
      return NextResponse.json({ error: "未配置 AI API Endpoint" }, { status: 400 });
    }

    if (!dataSources || !Array.isArray(dataSources) || dataSources.length === 0) {
      return NextResponse.json({ error: "没有数据源" }, { status: 400 });
    }

    const enabled = dataSources.filter((s: DataSource) => s.enabled);
    if (enabled.length === 0) {
      return NextResponse.json({ error: "没有启用的数据源" }, { status: 400 });
    }

    const results: { source: string; title: string; status: string; error?: string }[] = [];

    for (const source of enabled) {
      console.log(`Processing source: ${source.name}`);

      const items = await fetchRSS(source.url);
      console.log(`Found ${items.length} items`);

      if (items.length === 0) {
        results.push({ source: source.name, title: "", status: "error", error: "无法获取内容" });
        continue;
      }

      // Process first 2 items only
      for (const item of items.slice(0, 2)) {
        try {
          // Check duplicate
          if (await articleExists(item.link)) {
            results.push({ source: source.name, title: item.title, status: "skipped", error: "已存在" });
            continue;
          }

          const slug = makeSlug(item.title);

          // Get content
          let content = await convertUrl(item.link);
          if (!content) {
            content = item.description;
          }

          // Generate with LLM
          const generated = await generateArticle(content);

          // Save
          const saved = await saveArticle({
            title: generated?.title || item.title,
            date: new Date(item.pubDate).toISOString().split("T")[0],
            category: source.category,
            source_url: item.link,
            description: generated?.description || item.description.slice(0, 200),
            cover_image: "",
            content: generated?.content || content.slice(0, 1000),
            slug,
          });

          if (saved) {
            results.push({ source: source.name, title: item.title, status: "success" });
          } else {
            results.push({ source: source.name, title: item.title, status: "error", error: "保存失败" });
          }
        } catch (error: any) {
          console.error(`Item error:`, error);
          results.push({ source: source.name, title: item.title, status: "error", error: error.message });
        }
      }
    }

    const success = results.filter(r => r.status === "success").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const failed = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: true,
      results,
      message: `成功 ${success}，跳过 ${skipped}，失败 ${failed}`,
    });

  } catch (error: any) {
    console.error("Automation error:", error);
    return NextResponse.json({ error: error.message || "自动化失败" }, { status: 500 });
  }
}