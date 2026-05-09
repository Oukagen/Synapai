const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");
const publicDir = path.join(process.cwd(), "public");
const postsJsonPath = path.join(publicDir, "posts.json");

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s一-龥]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function savePost(data) {
  const { title, date, category, source_url, description, cover_image, is_featured, content } = data;

  const slug = generateSlug(title) + ".md";
  const filePath = path.join(postsDir, slug);

  const frontmatter = matter.stringify(content, {
    title,
    date,
    category,
    source_url,
    description,
    cover_image,
    is_featured: is_featured || false,
  });

  fs.writeFileSync(filePath, frontmatter, "utf8");
  console.log(`Saved: ${filePath}`);

  // Regenerate posts.json
  generatePostsJson();

  return slug;
}

function deletePost(slug) {
  const filePath = path.join(postsDir, slug.endsWith(".md") ? slug : `${slug}.md`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${filePath}`);
    generatePostsJson();
    return true;
  }
  return false;
}

function generatePostsJson() {
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));

  const posts = files
    .map((file) => {
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
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredPost = posts.find((p) => p.is_featured) || null;

  fs.writeFileSync(
    postsJsonPath,
    JSON.stringify({ posts, featuredPost }, null, 2),
    "utf8"
  );

  console.log(`Generated: ${postsJsonPath} with ${posts.length} posts`);
  return { posts, featuredPost };
}

// Initial generation if run directly
if (require.main === module) {
  generatePostsJson();
}

module.exports = { savePost, deletePost, generatePostsJson };