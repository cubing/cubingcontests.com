import Markdown from "react-markdown";
import z from "zod";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { getFormattedDate } from "~/helpers/utility-functions.ts";
import { getBlogPosts, getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  postId: z.string().nonempty(),
});

type Props = {
  params: Promise<z.infer<typeof ParamsValidator>>;
};

async function BlogPostPage({ params }: Props) {
  const { slug, postId } = ParamsValidator.parse(await params);

  const organization = await getOrgDetails({ slug });
  const [post] = await getBlogPosts(organization.id, { postId });

  if (!post) return <LoadingError loadingEntity="post" />;

  return (
    <section className="px-3 pb-2">
      <h2 className="mb-4 text-center">{post.title}</h2>

      <p className="card-text mb-4">
        <small className="text-body-secondary">
          Posted{post.authorName ? ` by ${post.authorName} ` : ""} on {getFormattedDate(post.date)}
        </small>
      </p>

      <div className="lh-lg">
        <Markdown>{post.content}</Markdown>
      </div>
    </section>
  );
}

export default BlogPostPage;
