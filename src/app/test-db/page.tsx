import { prisma } from "@/lib/prisma";

export default async function TestDbPage() {
  const users = await prisma.user.findMany();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Test baza de date</h1>
      <p className="mt-4">Numar utilizatori: {users.length}</p>
    </main>
  );
}
