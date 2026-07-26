import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackgroundColorPicker } from "@/components/BackgroundColorPicker";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { backgroundColor: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Background color</h2>
        <BackgroundColorPicker initialBackgroundColor={user?.backgroundColor ?? null} />
      </section>
    </main>
  );
}
