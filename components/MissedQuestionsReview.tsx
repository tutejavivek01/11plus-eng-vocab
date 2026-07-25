interface MissedQuestion {
  prompt: string;
  selectedText: string;
  correctText: string;
}

interface MissedQuestionsReviewProps {
  missed: MissedQuestion[];
}

export function MissedQuestionsReview({ missed }: MissedQuestionsReviewProps) {
  if (missed.length === 0) {
    return <p className="text-center text-green-700 dark:text-green-400">Perfect score, nothing missed!</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Questions to review</h2>
      <ul className="space-y-3">
        {missed.map((q, i) => (
          <li key={i} className="rounded border border-black/[.1] p-3 dark:border-white/[.15]">
            <p className="mb-1">{q.prompt}</p>
            <p className="text-sm text-red-700 dark:text-red-400">Your answer: {q.selectedText}</p>
            <p className="text-sm text-green-700 dark:text-green-400">Correct answer: {q.correctText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
