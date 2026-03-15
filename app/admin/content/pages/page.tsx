import type { Metadata } from "next";
import Link from "next/link";
import { db, flatPagesTable } from "@/lib/db";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Flat Pages" };

async function getFlatPages() {
  return db.select().from(flatPagesTable).orderBy(asc(flatPagesTable.title));
}

export default async function AdminPagesPage() {
  const pages = await getFlatPages();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Flat Pages</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {pages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No pages yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{page.title}</td>
                    <td className="py-3 px-4 text-gray-600">{page.slug}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/content/pages/${page.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
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
