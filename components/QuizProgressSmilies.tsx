import { CORRECT_CHIP_CLASS, INCORRECT_CHIP_CLASS } from "@/lib/ui/statusColors";

export type AnswerStatus = "unanswered" | "correct" | "incorrect";

interface QuizProgressSmiliesProps {
  statuses: AnswerStatus[];
}

const EMOJI: Record<AnswerStatus, string> = {
  unanswered: "😐",
  correct: "😊",
  incorrect: "😞",
};

const CHIP_CLASS: Record<AnswerStatus, string> = {
  unanswered:
    "border-zinc-300 bg-zinc-100 text-zinc-400 grayscale dark:border-zinc-600 dark:bg-zinc-800",
  correct: CORRECT_CHIP_CLASS,
  incorrect: INCORRECT_CHIP_CLASS,
};

export function QuizProgressSmilies({ statuses }: QuizProgressSmiliesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Quiz progress">
      {statuses.map((status, i) => (
        <span
          key={i}
          role="listitem"
          aria-label={`Question ${i + 1}: ${status}`}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base leading-none ${CHIP_CLASS[status]}`}
        >
          {EMOJI[status]}
        </span>
      ))}
    </div>
  );
}
