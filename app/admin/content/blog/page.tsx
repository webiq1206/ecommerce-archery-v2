import type { Metadata } from "next";
import Link from "next/link";
import { db, blogPostsTable } from "@/lib/db";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Blog Posts" };

async function getBlogPosts() {
  return db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt));
}

export default async function AdminBlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Blog Posts</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No blog posts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Published</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{post.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : post.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/content/blog/${post.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
