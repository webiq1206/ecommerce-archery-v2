import type { Metadata } from "next";
import { db, emailSubscribersTable } from "@/lib/db";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Email Subscribers" };

async function getSubscribers() {
  return db.select().from(emailSubscribersTable).orderBy(desc(emailSubscribersTable.subscribedAt));
}

export default async function AdminSubscribersPage() {
  const subscribers = await getSubscribers();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Email Subscribers</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {subscribers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No subscribers yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Source</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{sub.email}</td>
                    <td className="py-3 px-4">{sub.source ?? "—"}</td>
                    <td className="py-3 px-4">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
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
