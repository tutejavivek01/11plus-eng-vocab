import Link from "next/link";
import { TOPICS } from "@/lib/quiz/constants";

function topicLabel(topic: string): string {
  return TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

interface Attempt {
  id: string;
  topic: string;
  length: number;
  score: number;
  createdAt: Date | string;
}

export function AttemptList({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return <p className="text-zinc-500">No quiz attempts yet. Take a quiz to see your history here.</p>;
  }

  return (
    <ul className="divide-y divide-black/[.08] dark:divide-white/[.12]">
      {attempts.map((attempt) => (
        <li key={attempt.id}>
          <Link
            href={`/history/${attempt.id}`}
            className="flex items-center justify-between py-3 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
          >
            <div>
              <p className="font-medium">{topicLabel(attempt.topic)}</p>
              <p className="text-xs text-zinc-500">{new Date(attempt.createdAt).toLocaleDateString()}</p>
            </div>
            <p className="font-semibold">
              {attempt.score}/{attempt.length}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
