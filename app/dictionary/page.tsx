import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WordDictionarySearch } from "@/components/WordDictionarySearch";
import { WordUploadForm } from "@/components/WordUploadForm";

export default async function DictionaryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const words = await prisma.word.findMany({
    where: { topic: "general-vocabulary" },
    orderBy: { word: "asc" },
    select: { id: true, word: true, definition: true, synonym: true, antonym: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Word Dictionary</h1>
        <p className="text-sm text-zinc-500">General Vocabulary — {words.length} words</p>
      </div>
      <WordUploadForm />
      <WordDictionarySearch words={words} />
    </main>
  );
}
