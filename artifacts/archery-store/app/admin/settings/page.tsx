import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Settings</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Store</h2>
          <form action="/api/settings" method="post" className="space-y-6 max-w-md">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store name
              </label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                defaultValue="Apex Archery"
                placeholder="Store name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium">
              Save store settings
            </button>
          </form>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Email</h2>
          <form action="/api/settings" method="post" className="space-y-6 max-w-md">
            <div>
              <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 mb-1">
                From email
              </label>
              <input
                id="fromEmail"
                name="fromEmail"
                type="email"
                placeholder="noreply@store.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="replyTo" className="block text-sm font-medium text-gray-700 mb-1">
                Reply-to email
              </label>
              <input
                id="replyTo"
                name="replyTo"
                type="email"
                placeholder="support@store.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium">
              Save email settings
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
