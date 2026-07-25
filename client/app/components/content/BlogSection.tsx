"use client";

import { useParams } from "next/navigation";
import { use } from "react";
import BlogPostCard from "~/app/[slug]/posts/BlogPostCard.tsx";
import type { PostResponse } from "~/server/db/schema/posts.ts";

type Props = {
  latestBlogPostsPromise: Promise<(PostResponse & { authorName?: string | null })[]>;
};

function BlogSection({ latestBlogPostsPromise }: Props) {
  const latestBlogPosts = use(latestBlogPostsPromise);

  if (latestBlogPosts.length === 0) return;

  const { slug }: { slug: string } = useParams();

  return (
    <>
      <h3 className="rr-basic-heading">Latest blog post</h3>

      <div className="row row-gap-3">
        {latestBlogPosts.map((post) => (
          <div key={post.id} className="col-lg-6">
            <BlogPostCard organizationSlug={slug} post={post} />
          </div>
        ))}
      </div>
    </>
  );
}

export default BlogSection;
