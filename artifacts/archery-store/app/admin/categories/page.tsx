import type { Metadata } from "next";
import Link from "next/link";
import { db, categoriesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Categories" };

async function getCategories() {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  const parentMap = new Map(categories.map((c) => [c.id, c.name]));
  return categories.map((c) => ({ ...c, parentName: c.parentId ? parentMap.get(c.parentId) ?? null : null }));
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Categories</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No categories yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Parent</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{cat.name}</td>
                    <td className="py-3 px-4 text-gray-600">{cat.slug}</td>
                    <td className="py-3 px-4">{cat.parentName ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/categories/${cat.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
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
