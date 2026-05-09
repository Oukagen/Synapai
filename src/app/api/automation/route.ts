import { NextRequest, NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");

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

// Simple test endpoint
export async function GET() {
  try {
    const testUrl = "https://feeds.bbci.co.uk/news/technology/rss.xml";
    const response = await fetch(testUrl, {
      redirect: "follow",
    });
    const text = await response.text();

    return NextResponse.json({
      success: true,
      url: testUrl,
      status: response.status,
      textLength: text.length,
      textPreview: text.slice(0, 300),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
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

    // Detect feed type - RSS uses <item>, Atom uses <entry>
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

      // For Atom, title might have type="html" attribute
      let title = extractTag(itemXml, "title");
      if (!title) {
        // Try extracting from <name> for Atom author/creator
        const nameMatch = itemXml.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
        if (nameMatch) {
          title = decodeHtmlEntities(nameMatch[1].trim());
        }
      }

      // For Atom, link is in href attribute
      let link = extractTag(itemXml, "link");
      if (!link) {
        const linkMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
        if (linkMatch) {
          link = decodeHtmlEntities(linkMatch[1]);
        }
      }

      // description for RSS, summary/content for Atom
      let description = extractTag(itemXml, "description") ||
                        extractTag(itemXml, "summary") ||
                        extractTag(itemXml, "content");
      const pubDate = extractTag(itemXml, "pubDate") ||
                      extractTag(itemXml, "published") ||
                      extractTag(itemXml, "updated");

      // Extract image: try media:thumbnail, media:content, then img from HTML
      let imageUrl = extractMediaTag(itemXml, "thumbnail") ||
                     extractMediaTag(itemXml, "content");

      // Fallback: extract from description/summary HTML content
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

// Extract media tag (thumbnail/content) attribute
function extractMediaTag(xml: string, tag: string): string {
  const regex = new RegExp(`<media:${tag}[^>]*url=["']([^"']+)["'][^>]*>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

// Extract image from HTML content (for Atom feeds or feeds without media tags)
function extractImageFromHtml(html: string): string {
  // Try to find <img src="..."> in the HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = html.match(imgRegex);
  return match ? match[1] : "";
}

// Decode HTML entities (e.g. &#8217; -> ', &amp; -> &)
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
  // Use regular string to avoid template literal escaping issues
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
  // Remove common stop words and get main keywords
  const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "it", "its", "as", "from", "up", "down", "out", "about", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "also", "现在", "如何", "什么", "为什么", "怎么样", "的", "了", "和", "是", "在", "与", "或", "等"];

  // Extract English words and Chinese characters
  const englishWords = title.match(/[a-zA-Z][a-zA-Z0-9-]*/g) || [];
  const chineseChars = title.match(/[一-龥]+/g) || [];

  // Filter and combine
  const filteredEnglish = englishWords
    .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()))
    .slice(0, 3);

  const filteredChinese = chineseChars
    .filter(w => !stopWords.some(sw => w.includes(sw)))
    .slice(0, 3);

  return [...filteredEnglish, ...filteredChinese].slice(0, 5).join(" ");
}

// Multi-color gradient presets for variety
const gradientPresets = [
  { stops: ["#ff6b6b", "#feca57", "#48dbfb", "#667eea", "#a855f7"], angle: "0,0 100,100" },
  { stops: ["#00d9ff", "#6365f1", "#a855f7", "#ec4899"], angle: "0,100 100,0" },
  { stops: ["#f59e0b", "#10b981", "#06b6d4"], angle: "0,0 100,100" },
  { stops: ["#fb923c", "#a855f7", "#ec4899", "#3b82f6"], angle: "0,0 100,100" },
  { stops: ["#3b82f6", "#10b981", "#eab308", "#f97316", "#ef4444"], angle: "0,100 100,0" },
  { stops: ["#4c1d95", "#1e3a5f", "#065f46", "#0f766e"], angle: "100,0 0,100" },
];

// Generate cover image using SVG with multi-color gradient and frosted glass effect
async function generateCoverImage(title: string, slug: string): Promise<string> {
  const keywords = extractKeywords(title);
  if (!keywords) {
    console.log(`[ImageGen] No keywords extracted from title: ${title}`);
    return "";
  }

  // Pick a random gradient preset based on slug hash for consistency
  const slugHash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientIndex = slugHash % gradientPresets.length;
  const gradient = gradientPresets[gradientIndex];

  // Generate random positions for blur ellipses based on slug hash
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

  // Truncate keywords if too long
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

  try {
    const coversDir = path.join(process.cwd(), "public", "generated-covers");
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }

    const fileName = `${slug}.svg`;
    const filePath = path.join(coversDir, fileName);

    fs.writeFileSync(filePath, svg, "utf8");

    const savedUrl = `/generated-covers/${fileName}`;
    console.log(`[ImageGen] Saved SVG to: ${savedUrl}`);
    return savedUrl;
  } catch (error) {
    console.error("[ImageGen] Error:", error);
    return "";
  }
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

  // Call LLM API
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

  // Parse generated content
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

  // Map Chinese category to ID
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

// Check if article with same source_url already exists (true deduplication by URL)
function articleExistsByUrl(sourceUrl: string): { exists: boolean; slug?: string } {
  const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));

  for (const file of files) {
    const fullPath = path.join(postsDir, file);
    const { data } = matter(fs.readFileSync(fullPath, "utf8"));

    if (data.source_url === sourceUrl) {
      return { exists: true, slug: file.replace(/\.md$/, "") };
    }
  }

  return { exists: false };
}

// Save article to file
function saveArticle(data: {
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  content: string;
  slug?: string;  // Optional: pass original RSS slug to ensure consistent deduplication
}): string {
  const slug = data.slug || generateSlug(data.title);
  const filePath = path.join(postsDir, `${slug}.md`);

  // Escape Chinese curly quotes to prevent YAML parsing issues
  const escapeQuotes = (str: string) => str.replace(/"/g, '\\"').replace(/"/g, '\\"');

  const frontmatter = [
    "---",
    `title: "${escapeQuotes(data.title)}"`,
    `date: "${data.date}"`,
    `category: "${data.category}"`,
    `source_url: "${escapeQuotes(data.source_url)}"`,
    `description: "${escapeQuotes(data.description)}"`,
    `cover_image: "${escapeQuotes(data.cover_image)}"`,
    `is_featured: ${data.is_featured}`,
    "---",
    data.content
  ].join("\n");

  fs.writeFileSync(filePath, frontmatter, "utf8");

  // Regenerate posts.json
  regeneratePostsJson();

  return slug;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s一-龥]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) || "untitled-" + Date.now();
}

function regeneratePostsJson() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));
  const posts = files.map((file: string) => {
    const fullPath = path.join(postsDir, file);
    const { data } = matter(fs.readFileSync(fullPath, "utf8"));
    return {
      slug: file.replace(/\.md$/, ""),
      title: data.title || "",
      date: data.date || "",
      category: data.category || "",
      source_url: data.source_url || "",
      description: data.description || "",
      cover_image: data.cover_image || "",
      is_featured: data.is_featured || false,
    };
  }).sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredPost = posts.find((p: { is_featured: boolean }) => p.is_featured) || null;
  fs.writeFileSync(
    path.join(publicDir, "posts.json"),
    JSON.stringify({ posts, featuredPost }, null, 2),
    "utf8"
  );
}

// Trigger Netlify deploy (for auto-deployment after generating new content)
async function triggerNetlifyDeploy() {
  const deployHook = process.env.NETLIFY_DEPLOY_HOOK;
  if (!deployHook) {
    console.log("[Deploy] No NETLIFY_DEPLOY_HOOK configured");
    return;
  }

  try {
    await fetch(deployHook, { method: "POST" });
    console.log("[Deploy] Netlify deploy triggered successfully");
  } catch (error) {
    console.error("[Deploy] Failed to trigger Netlify deploy:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { llmConfig, dataSources, defaultCoverImage } = body;

    // Use environment variables as fallback for server-side/automation use
    // This allows scheduled tasks to work without passing config in request body
    if (!llmConfig?.apiKey && process.env.AUTOMATION_LLM_API_KEY) {
      llmConfig = {
        provider: process.env.AUTOMATION_LLM_PROVIDER || "custom",
        apiKey: process.env.AUTOMATION_LLM_API_KEY,
        endpoint: process.env.AUTOMATION_LLM_ENDPOINT || "",
        model: process.env.AUTOMATION_LLM_MODEL || "",
      };
    }

    if (!llmConfig?.apiKey) {
      return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
    }

    if (!dataSources || !Array.isArray(dataSources) || dataSources.length === 0) {
      return NextResponse.json({ error: "没有可用的数据源" }, { status: 400 });
    }

    const enabledSources = dataSources.filter((s: DataSource) => s.enabled);
    console.log("Enabled sources:", enabledSources);

    if (enabledSources.length === 0) {
      return NextResponse.json({ error: "没有启用的数据源" }, { status: 400 });
    }

    const results: { source: string; title: string; status: string; error?: string }[] = [];

    // Process each enabled data source
    for (const source of enabledSources) {
      try {
        // Fetch RSS items
        const items = await fetchRSS(source.url);
        console.log(`Fetched ${items.length} items from ${source.name}`);

        if (items.length === 0) {
          // Return debug info for troubleshooting
          results.push({ source: source.name, title: "", status: "error", error: "RSS 无内容或解析失败" });
          continue;
        }

        // Process each item (limit to latest 3 to avoid too many API calls)
        for (const item of items.slice(0, 3)) {
          try {
            // Check for duplicates using source_url (the original article link)
            // This is more reliable than title-based slug which can change after LLM rewriting
            const urlCheck = articleExistsByUrl(item.link);

            console.log(`[Automation] Checking duplicate: title="${item.title}", link="${item.link}", urlExists=${urlCheck.exists}`);

            if (urlCheck.exists) {
              results.push({ source: source.name, title: item.title, status: "skipped", error: "已存在" });
              continue;
            }

            // Also check by slug for backward compatibility
            const slug = generateSlug(item.title);
            const existingPath = path.join(postsDir, `${slug}.md`);
            if (fs.existsSync(existingPath)) {
              results.push({ source: source.name, title: item.title, status: "skipped", error: "已存在" });
              continue;
            }

            // Convert to Markdown (fallback to description if Jina AI fails)
            let markdown = "";
            try {
              markdown = await convertToMarkdown(item.link);
            } catch (e) {
              console.log("Jina AI failed, using description fallback");
              markdown = item.description || "";
            }

            // Generate article with LLM
            const generated = await generateArticle(markdown, llmConfig);

            // Determine cover image: RSS image > default cover > AI generated
            let coverImage = item.imageUrl || defaultCoverImage || process.env.AUTOMATION_DEFAULT_COVER_IMAGE || "";

            // If no cover image, generate one using AI
            if (!coverImage) {
              console.log(`[Automation] No cover image found, generating AI cover for: ${generated.title || item.title}`);
              try {
                coverImage = await generateCoverImage(generated.title || item.title, slug);
              } catch (e) {
                console.error("[Automation] AI cover generation failed:", e);
              }
            }

            const savedSlug = saveArticle({
              title: generated.title || item.title,
              date: new Date(item.pubDate).toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
              category: source.category,
              source_url: item.link,
              description: generated.description || item.description.slice(0, 200),
              cover_image: coverImage,
              is_featured: false,
              content: generated.content || markdown.slice(0, 2000),
              slug: slug,  // Use original RSS title's slug for deduplication
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

    // Trigger Netlify deploy after successful automation
    triggerNetlifyDeploy();

    return NextResponse.json({
      success: true,
      results,
      message: `处理完成：成功 ${results.filter(r => r.status === "success").length} 篇，跳过 ${results.filter(r => r.status === "skipped").length} 篇，失败 ${results.filter(r => r.status === "error").length} 篇（部署已触发）`
    });
  } catch (error: any) {
    console.error("Automation error:", error);
    return NextResponse.json({ error: error.message || "自动化更新失败" }, { status: 500 });
  }
}