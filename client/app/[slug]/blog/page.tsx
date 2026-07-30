import BlogPostCard from "~/app/[slug]/blog/BlogPostCard";
import { getBlogPosts, getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

export const metadata = {
  title: "Blog",
  description: process.env.METADATA_POSTS_DESCRIPTION,
  openGraph: {
    images: [`${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL}/assets/screenshots/blog.jpg`],
  },
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function PostsPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const posts = await getBlogPosts(organization.id);

  return (
    <section>
      <h2 className="mb-4 text-center">Blog</h2>

      {posts.length === 0 ? (
        <p className="fs-5 mx-3 mt-4 text-center">No posts have been published yet</p>
      ) : (
        <div className="row mx-0 mt-4 mb-2">
          {posts.map((post) => (
            <div key={post.id} className="col-md-6 mb-4">
              <BlogPostCard organizationSlug={slug} post={post} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default PostsPage;
