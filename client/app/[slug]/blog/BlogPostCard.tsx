import { differenceInDays } from "date-fns";
import Link from "next/link";
import { getFormattedDate, slugPath } from "~/helpers/utility-functions.ts";
import type { PostResponse } from "~/server/db/schema/posts.ts";

type Props = {
  organizationSlug: string;
  post: PostResponse & { authorName?: string | null };
};

function BlogPostCard({ organizationSlug, post }: Props) {
  return (
    <div className="card tw:relative h-100">
      {differenceInDays(new Date(), post.date) < 7 && (
        <span className="translate-middle badge fs-6 tw:absolute tw:-inset-e-10 top-0 tw:z-10 rounded-pill bg-danger">
          New
        </span>
      )}

      <div className="card-body">
        <h5 className="card-title">{post.title}</h5>

        <p className="card-text">
          <small className="text-body-secondary">{getFormattedDate(post.date)}</small>
        </p>

        <p className="card-text text-truncate">{post.content}</p>

        {post.authorName && (
          <p className="card-text">
            <small className="text-body-secondary">Posted by {post.authorName}</small>
          </p>
        )}

        <Link href={slugPath(organizationSlug, `/blog/${post.postId}`)} prefetch={false} className="btn btn-primary">
          Read more
        </Link>
      </div>
    </div>
  );
}

export default BlogPostCard;
