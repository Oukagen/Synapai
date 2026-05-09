import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const postsDirectory = path.join(process.cwd(), "content/posts");

// Build a slug map for fast lookup
function buildSlugMap(): Map<string, string> {
  const slugMap = new Map();
  if (!fs.existsSync(postsDirectory)) return slugMap;

  const files = fs.readdirSync(postsDirectory).filter(f => f.endsWith(".md"));
  files.forEach(file => {
    const slug = file.replace(/\.md$/, "");
    slugMap.set(slug.toLowerCase(), slug);
  });
  return slugMap;
}

// Find actual file by slug (handles URL encoding issues)
function findFileBySlug(slug: string): string | null {
  const files = fs.readdirSync(postsDirectory);
  const target = slug.toLowerCase();

  // First try exact match (case-insensitive)
  const exactMatch = files.find(f => f.replace(/\.md$/, "").toLowerCase() === target);
  if (exactMatch) return exactMatch;

  // Try partial match: find file where non-ASCII portion starts the same
  // This handles URL encoding issues with Chinese characters
  const parts = slug.split(/-/);
  const prefix = parts.slice(0, 3).join("-").toLowerCase();

  if (prefix.length > 5) {
    const partialMatch = files.find(f => {
      const fileLower = f.replace(/\.md$/, "").toLowerCase();
      return fileLower.startsWith(prefix) || prefix.startsWith(fileLower.slice(0, parts.join("-").length));
    });
    if (partialMatch) return partialMatch;
  }

  return null;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  content: string;
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"));
}

export function getPostBySlug(slug: string): Post {
  const matchedFile = findFileBySlug(slug);

  if (!matchedFile) {
    throw new Error(`Post not found: ${slug}`);
  }

  const fileContents = fs.readFileSync(path.join(postsDirectory, matchedFile), "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug: matchedFile.replace(/\.md$/, ""),
    title: data.title || "",
    date: data.date || "",
    category: data.category || "",
    source_url: data.source_url || "",
    description: data.description || "",
    cover_image: data.cover_image || "",
    is_featured: data.is_featured || false,
    content: content,
  };
}

export async function getPostContentHtml(content: string): Promise<string> {
  const processed = await remark().use(remarkHtml).process(content);
  return processed.toString();
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  return slugs
    .map((slug) => getPostBySlug(slug))
    .sort(
      (a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime())
    );
}

export function getPostsByCategory(category: string): Post[] {
  const allPosts = getAllPosts();
  if (category === "all") {
    return allPosts;
  }
  return allPosts.filter((post) => post.category === category);
}

export function getFeaturedPost(): Post | null {
  const allPosts = getAllPosts();
  return allPosts.find((post) => post.is_featured) || null;
}

export function getRelatedPosts(currentSlug: string, category: string, limit = 3): Post[] {
  return getPostsByCategory(category)
    .filter((post) => post.slug !== currentSlug)
    .slice(0, limit);
}

export { categories } from "./constants";
