import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    draft: z.boolean().default(true),
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    readTime: z.string().optional(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    coverImageAlt: z.string().optional(),
  }).superRefine((post, context) => {
    if (!post.draft && !post.pubDate) {
      context.addIssue({ code: "custom", path: ["pubDate"], message: "Published posts must include pubDate." });
    }
    if (post.coverImage && !post.coverImageAlt) {
      context.addIssue({ code: "custom", path: ["coverImageAlt"], message: "Images must include descriptive coverImageAlt text." });
    }
  }),
});

export const collections = { blog };
