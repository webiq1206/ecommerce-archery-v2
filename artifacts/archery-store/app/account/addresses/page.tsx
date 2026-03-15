import { redirect } from "next/navigation";
import { db, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { AddressBookClient } from "./AddressBookClient";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const addresses = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.userId, session.user.id));

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider mb-8">
        Address Book
      </h1>
      <AddressBookClient initialAddresses={addresses} />
    </div>
  );
}
