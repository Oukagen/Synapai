import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface LLMConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

interface DataSource {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  enabled: boolean;
}

// Fetch RSS/Atom feed and return items
async function fetchRSS(url: string): Promise<{ title: string; link: string; description: string; pubDate: string; imageUrl?: string }[]> {
  console.log(`[fetchRSS] Starting fetch for URL: ${url}`);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Synapai Bot)",
        "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml",
      },
    });
    console.log(`[fetchRSS] Response status: ${response.status}`);
    const xml = await response.text();
    console.log(`[fetchRSS] XML received, length: ${xml.length}`);

    const isAtom = xml.includes("<feed") || xml.includes("<entry");
    const itemRegex = isAtom
      ? /<entry[^>]*>([\s\S]*?)<\/entry>/gi
      : /<item[^>]*>([\s\S]*?)<\/item>/gi;

    const items: { title: string; link: string; description: string; pubDate: string; imageUrl?: string }[] = [];
    let match;
    let matchCount = 0;

    while ((match = itemRegex.exec(xml)) !== null) {
      matchCount++;
      const itemXml = match[1];

      let title = extractTag(itemXml, "title");
      if (!title) {
        const nameMatch = itemXml.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
        if (nameMatch) {
          title = decodeHtmlEntities(nameMatch[1].trim());
        }
      }

      let link = extractTag(itemXml, "link");
      if (!link) {
        const linkMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
        if (linkMatch) {
          link = decodeHtmlEntities(linkMatch[1]);
        }
      }

      let description = extractTag(itemXml, "description") ||
                        extractTag(itemXml, "summary") ||
                        extractTag(itemXml, "content");
      const pubDate = extractTag(itemXml, "pubDate") ||
                      extractTag(itemXml, "published") ||
                      extractTag(itemXml, "updated");

      let imageUrl = extractMediaTag(itemXml, "thumbnail") ||
                     extractMediaTag(itemXml, "content");

      if (!imageUrl && description) {
        imageUrl = extractImageFromHtml(description);
      }

      console.log(`[fetchRSS] Item ${matchCount}: title="${title}", image="${imageUrl}"`);

      if (title) {
        items.push({ title, link, description, pubDate, imageUrl });
      }
    }

    console.log(`[fetchRSS] Total items found: ${matchCount}, valid items: ${items.length}`);
    return items;
  } catch (error) {
    console.error("[fetchRSS] Error:", error);
    return [];
  }
}

function extractMediaTag(xml: string, tag: string): string {
  const regex = new RegExp(`<media:${tag}[^>]*url=["']([^"']+)["'][^>]*>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

function extractImageFromHtml(html: string): string {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = html.match(imgRegex);
  return match ? match[1] : "";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTag(xml: string, tag: string): string {
  const whitespace = "[\\s\\S]";
  const cdataPart = "<" + tag + "[^>]*><!\\[CDATA\\[(" + whitespace + "*?)\\]\\]><\\/" + tag + ">";
  const normalPart = "<" + tag + "[^>]*>(" + whitespace + "*?)<\\/" + tag + ">";
  const regex = new RegExp(cdataPart + "|" + normalPart, "i");
  const match = xml.match(regex);
  if (match) {
    return decodeHtmlEntities((match[1] || match[2] || "").trim());
  }
  return "";
}

// Extract keywords from title for image generation
function extractKeywords(title: string): string {
  const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "it", "its", "as", "from", "up", "down", "out", "about", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "also", "现在", "如何", "什么", "为什么", "怎么样", "的", "了", "和", "是", "在", "与", "或", "等"];

  const englishWords = title.match(/[a-zA-Z][a-zA-Z0-9-]*/g) || [];
  const chineseChars = title.match(/[一-龥]+/g) || [];

  const filteredEnglish = englishWords
    .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()))
    .slice(0, 3);

  const filteredChinese = chineseChars
    .filter(w => !stopWords.some(sw => w.includes(sw)))
    .slice(0, 3);

  return [...filteredEnglish, ...filteredChinese].slice(0, 5).join(" ");
}

// Multi-color gradient presets
const gradientPresets = [
  { stops: ["#ff6b6b", "#feca57", "#48dbfb", "#667eea", "#a855f7"], angle: "0,0 100,100" },
  { stops: ["#00d9ff", "#6365f1", "#a855f7", "#ec4899"], angle: "0,100 100,0" },
  { stops: ["#f59e0b", "#10b981", "#06b6d4"], angle: "0,0 100,100" },
  { stops: ["#fb923c", "#a855f7", "#ec4899", "#3b82f6"], angle: "0,0 100,100" },
  { stops: ["#3b82f6", "#10b981", "#eab308", "#f97316", "#ef4444"], angle: "0,100 100,0" },
  { stops: ["#4c1d95", "#1e3a5f", "#065f46", "#0f766e"], angle: "100,0 0,100" },
];

// Generate cover image - returns SVG as data URL (can be stored in Supabase)
async function generateCoverImage(title: string, slug: string): Promise<string> {
  const keywords = extractKeywords(title);
  if (!keywords) {
    console.log(`[ImageGen] No keywords extracted from title: ${title}`);
    return "";
  }

  const slugHash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientIndex = slugHash % gradientPresets.length;
  const gradient = gradientPresets[gradientIndex];

  const blurPositions = [
    { cx: 150 + (slugHash % 100), cy: 150 + ((slugHash * 7) % 200), rx: 350 + (slugHash % 80), ry: 220 + ((slugHash * 3) % 60) },
    { cx: 950 + ((slugHash * 11) % 100), cy: 450 + ((slugHash * 13) % 100), rx: 320 + ((slugHash * 5) % 70), ry: 200 + ((slugHash * 17) % 50) },
    { cx: 550 + ((slugHash * 19) % 150), cy: 350 + ((slugHash * 23) % 150), rx: 280 + ((slugHash * 7) % 60), ry: 180 + ((slugHash * 11) % 40) },
  ];

  const stopsHtml = gradient.stops.map((color, i) =>
    `<stop offset="${(i * 100) / (gradient.stops.length - 1)}%" stop-color="${color}"/>`
  ).join("");

  const blurEllipsesHtml = blurPositions.map((blur, i) =>
    `<ellipse cx="${blur.cx}" cy="${blur.cy}" rx="${blur.rx}" ry="${blur.ry}" fill="#ffffff" opacity="0.1" filter="url(#blur${i + 1})"/>`
  ).join("");

  const displayText = keywords.length > 15 ? keywords.substring(0, 15) + "..." : keywords;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="${gradient.angle.split(" ")[0].split(",")[0]}%" y1="${gradient.angle.split(" ")[0].split(",")[1]}%" x2="${gradient.angle.split(" ")[1].split(",")[0]}%" y2="${gradient.angle.split(" ")[1].split(",")[1]}%">
      ${stopsHtml}
    </linearGradient>
    <filter id="blur1"><feGaussianBlur in="SourceGraphic" stdDeviation="30"/></filter>
    <filter id="blur2"><feGaussianBlur in="SourceGraphic" stdDeviation="28"/></filter>
    <filter id="blur3"><feGaussianBlur in="SourceGraphic" stdDeviation="26"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${blurEllipsesHtml}
  <text x="600" y="315" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="600" letter-spacing="4">${escapeXml(displayText)}</text>
  <text x="600" y="385" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="300" opacity="0.7">科技资讯</text>
</svg>`;

  // Return as data URL for storage in Supabase
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convert URL to Markdown using Jina AI
async function convertToMarkdown(url: string): Promise<string> {
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl);
    if (!response.ok) {
      throw new Error("Jina AI request failed");
    }
    return await response.text();
  } catch (error) {
    console.error("Jina AI error:", error);
    throw error;
  }
}

// Generate article using LLM
async function generateArticle(content: string, llmConfig: LLMConfig): Promise<{
  title: string;
  description: string;
  category: string;
  content: string;
}> {
  const promptTemplate = `请根据以下内容生成一篇突触简报的文章：

## 要求
- 标题简洁有力，不超过30字
- 摘要100字以内，突出核心信息
- 自动分类到对应板块
- 支持的板块：大厂动态、行业脉搏、模型追踪、工具开箱、热门skill
- 正文用Markdown格式，层次分明

## 内容
{content}

## 输出格式（严格按此格式返回，不要有其他内容）
标题：
摘要：
分类：
正文：`;

  const prompt = promptTemplate.replace("{content}", content);

  const messages = [
    { role: "system", content: "你是一个专业的科技资讯编辑，擅长撰写简洁有力的文章摘要和正文。" },
    { role: "user", content: prompt },
  ];

  const response = await fetch(`${llmConfig.endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${llmConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: llmConfig.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;

  const lines = generatedText.split("\n");
  let title = "", description = "", category = "", contentPart = "";
  let currentSection = "";

  for (const line of lines) {
    if (line.startsWith("标题：") || line.startsWith("标题:")) {
      title = line.replace(/^标题[：:]\s*/, "").trim();
      currentSection = "title";
    } else if (line.startsWith("摘要：") || line.startsWith("摘要:")) {
      description = line.replace(/^摘要[：:]\s*/, "").trim();
      currentSection = "description";
    } else if (line.startsWith("分类：") || line.startsWith("分类:")) {
      category = line.replace(/^分类[：:]\s*/, "").trim();
      currentSection = "category";
    } else if (line.startsWith("正文：") || line.startsWith("正文:")) {
      contentPart = line.replace(/^正文[：:]\s*/, "").trim() + "\n";
      currentSection = "content";
    } else if (currentSection === "content") {
      contentPart += line + "\n";
    }
  }

  const categoryMap: Record<string, string> = {
    "大厂动态": "tech-giants",
    "行业脉搏": "industry-pulse",
    "模型追踪": "model-tracking",
    "工具开箱": "tool-unboxing",
    "热门skill": "hot-tools",
  };

  return {
    title,
    description,
    category: categoryMap[category] || "tech-giants",
    content: contentPart.trim(),
  };
}

// Check if article with same source_url already exists
async function articleExistsByUrl(sourceUrl: string): Promise<{ exists: boolean; slug?: string }> {
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  return { exists: !!data, slug: data?.slug };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s一-龥]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) || "untitled-" + Date.now();
}

// Save article to Supabase
async function saveArticle(data: {
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  content: string;
  slug?: string;
}): Promise<string> {
  const slug = data.slug || generateSlug(data.title);

  const { error } = await supabase.from("articles").insert({
    slug,
    title: data.title,
    date: data.date,
    category: data.category,
    source_url: data.source_url,
    description: data.description,
    cover_image: data.cover_image,
    is_featured: data.is_featured,
    content: data.content,
  });

  if (error) {
    console.error("Supabase save error:", error);
    throw new Error("Failed to save article");
  }

  return slug;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { dataSources, defaultCoverImage } = body;

    // Debug: log all environment variables (except the actual key)
    console.log("Automation LLM Config:");
    console.log("- PROVIDER:", process.env.AUTOMATION_LLM_PROVIDER);
    console.log("- ENDPOINT:", process.env.AUTOMATION_LLM_ENDPOINT);
    console.log("- MODEL:", process.env.AUTOMATION_LLM_MODEL);
    console.log("- HAS API KEY:", !!process.env.AUTOMATION_LLM_API_KEY);

    if (!process.env.AUTOMATION_LLM_API_KEY) {
      return NextResponse.json({ error: "请先在环境变量中配置 AI API Key" }, { status: 400 });
    }

    if (!process.env.AUTOMATION_LLM_ENDPOINT) {
      return NextResponse.json({ error: "请先在环境变量中配置 AI API Endpoint" }, { status: 400 });
    }

    const llmConfig = {
      provider: process.env.AUTOMATION_LLM_PROVIDER || "custom",
      apiKey: process.env.AUTOMATION_LLM_API_KEY,
      endpoint: process.env.AUTOMATION_LLM_ENDPOINT,
      model: process.env.AUTOMATION_LLM_MODEL || "",
    };

    if (!dataSources || !Array.isArray(dataSources) || dataSources.length === 0) {
      return NextResponse.json({ error: "没有可用的数据源" }, { status: 400 });
    }

    const enabledSources = dataSources.filter((s: DataSource) => s.enabled);
    console.log("Enabled sources:", enabledSources);

    if (enabledSources.length === 0) {
      return NextResponse.json({ error: "没有启用的数据源" }, { status: 400 });
    }

    const results: { source: string; title: string; status: string; error?: string }[] = [];

    for (const source of enabledSources) {
      try {
        const items = await fetchRSS(source.url);
        console.log(`Fetched ${items.length} items from ${source.name}`);

        if (items.length === 0) {
          results.push({ source: source.name, title: "", status: "error", error: "RSS 无内容或解析失败" });
          continue;
        }

        for (const item of items.slice(0, 3)) {
          try {
            const urlCheck = await articleExistsByUrl(item.link);
            console.log(`[Automation] Checking duplicate: title="${item.title}", link="${item.link}", urlExists=${urlCheck.exists}`);

            if (urlCheck.exists) {
              results.push({ source: source.name, title: item.title, status: "skipped", error: "已存在" });
              continue;
            }

            const slug = generateSlug(item.title);

            let markdown = "";
            try {
              markdown = await convertToMarkdown(item.link);
            } catch (e) {
              console.log("Jina AI failed, using description fallback");
              markdown = item.description || "";
            }

            const generated = await generateArticle(markdown, llmConfig);

            let coverImage = item.imageUrl || defaultCoverImage || process.env.AUTOMATION_DEFAULT_COVER_IMAGE || "";

            if (!coverImage) {
              console.log(`[Automation] No cover image found, generating AI cover for: ${generated.title || item.title}`);
              try {
                coverImage = await generateCoverImage(generated.title || item.title, slug);
              } catch (e) {
                console.error("[Automation] AI cover generation failed:", e);
              }
            }

            const savedSlug = await saveArticle({
              title: generated.title || item.title,
              date: new Date(item.pubDate).toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
              category: source.category,
              source_url: item.link,
              description: generated.description || (item.description?.slice(0, 200) || ""),
              cover_image: coverImage,
              is_featured: false,
              content: generated.content || markdown.slice(0, 2000),
              slug: slug,
            });

            results.push({ source: source.name, title: generated.title || item.title, status: "success" });
          } catch (itemError: any) {
            console.error("Item error:", itemError);
            results.push({ source: source.name, title: item.title, status: "error", error: itemError.message });
          }
        }
      } catch (sourceError: any) {
        console.error("Source error:", sourceError);
        results.push({ source: source.name, title: "", status: "error", error: sourceError.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `处理完成：成功 ${results.filter(r => r.status === "success").length} 篇，跳过 ${results.filter(r => r.status === "skipped").length} 篇，失败 ${results.filter(r => r.status === "error").length} 篇`
    });
  } catch (error: any) {
    console.error("Automation error:", error);
    // Return 200 with error details instead of 500 to show results
    return NextResponse.json({
      success: false,
      error: error.message || "自动化更新失败",
      results
    }, { status: 200 });
  }
}