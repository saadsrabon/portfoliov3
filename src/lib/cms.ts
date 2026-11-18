import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const safeAsset = z.string().trim().min(1).max(500).refine((value) => (value.startsWith("/images/") || value === "/social-card.png") && !value.includes("..") && !/[<>"']/u.test(value), "Use a local /images/ asset path or /social-card.png.").optional().or(z.literal(""));
const safeCanonical = z.url().trim().max(500).refine((value) => {
  try { return new URL(value).origin === "https://saadsrabon.com"; } catch { return false; }
}).optional().or(z.literal(""));

export const postInputSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(12).max(280),
  bodyMarkdown: z.string().trim().min(20).max(50_000),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  readTime: z.string().trim().max(40).optional().or(z.literal("")),
  coverImage: safeAsset,
  coverImageAlt: z.string().trim().max(300).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(140).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  canonicalUrl: safeCanonical,
  socialImage: safeAsset,
}).strict().superRefine((data, context) => {
  if (data.coverImage && !data.coverImageAlt) context.addIssue({ code: "custom", path: ["coverImageAlt"], message: "An image requires descriptive alt text." });
  if (data.status === "published" && data.bodyMarkdown.length < 80) context.addIssue({ code: "custom", path: ["bodyMarkdown"], message: "Add meaningful article content before publishing." });
});

const resourceUrl = z.url().max(1500).refine((value) => new URL(value).protocol === "https:", "Resource links must use HTTPS.");
export const resourceInputSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().min(12).max(500),
  author: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.enum(["learning", "tools", "reading", "media"]),
  url: resourceUrl,
  coverImage: safeAsset,
  coverImageAlt: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().trim().max(140).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
}).strict().superRefine((data, context) => {
  if (data.coverImage && !data.coverImageAlt) context.addIssue({ code: "custom", path: ["coverImageAlt"], message: "An image requires descriptive alt text." });
});

marked.setOptions({ gfm: true, breaks: false });
const safeTags = ["p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "em", "del", "blockquote", "ul", "ol", "li", "pre", "code", "a", "table", "thead", "tbody", "tr", "th", "td"];
export async function renderSafeMarkdown(markdown: string) {
  const output = await marked.parse(markdown, { async: true });
  return sanitizeHtml(output, {
    allowedTags: safeTags,
    allowedAttributes: { a: ["href", "title"], th: ["align"], td: ["align"] },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener noreferrer" }) },
  });
}

export function safePostJson(post: Record<string, unknown>) {
  return {
    ...post,
    seoTitle: post.seoTitle || post.title,
    seoDescription: post.seoDescription || post.description,
    canonicalUrl: post.canonicalUrl || `https://saadsrabon.com/blog/${post.slug}/`,
    socialImage: post.socialImage || "/social-card.png",
  };
}
