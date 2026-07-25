interface ScoreSummaryProps {
  score: number;
  length: number;
}

export function ScoreSummary({ score, length }: ScoreSummaryProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-zinc-500">Your score</p>
      <p className="text-4xl font-bold">
        {score}/{length}
      </p>
    </div>
  );
}
