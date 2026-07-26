import type { ReactNode } from "react";
import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";
import { CORRECT_CHIP_CLASS, INCORRECT_CHIP_CLASS } from "@/lib/ui/statusColors";

interface SpellingQuestionCardProps {
  question: GeneratedQuestion;
  selected: string | null;
  feedback: { isCorrect: boolean; correctText: string; explanation?: string } | null;
  onSelect: (option: string) => void;
}

const OPTION_LABELS: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E — No error",
};

function renderSentence(sentence: string): ReactNode[] {
  return sentence.split(/(\[[A-E]\])/g).map((part, i) => {
    const match = part.match(/^\[([A-E])\]$/);
    if (!match) return <span key={i}>{part}</span>;
    return (
      <sup key={i} className="mx-0.5 font-semibold text-zinc-500 dark:text-zinc-400">
        {match[1]}
      </sup>
    );
  });
}

export function SpellingQuestionCard({ question, selected, feedback, onSelect }: SpellingQuestionCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">{renderSentence(question.prompt)}</p>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isSelected = selected === option;
          const isCorrectOption = feedback !== null && option === feedback.correctText;
          const isWrongSelected = feedback !== null && isSelected && !feedback.isCorrect;

          let className =
            "rounded border px-4 py-2 font-medium transition-colors border-black/[.15] dark:border-white/[.2]";
          if (feedback) {
            if (isCorrectOption) {
              className += ` ${CORRECT_CHIP_CLASS}`;
            } else if (isWrongSelected) {
              className += ` ${INCORRECT_CHIP_CLASS}`;
            }
          } else if (isSelected) {
            className += " bg-black/[.04] dark:bg-white/[.08]";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              disabled={feedback !== null}
              className={className}
            >
              {OPTION_LABELS[option] ?? option}
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className="space-y-1">
          <p
            className={
              feedback.isCorrect
                ? "font-medium text-green-700 dark:text-green-400"
                : "font-medium text-red-700 dark:text-red-400"
            }
          >
            {feedback.isCorrect ? "Correct!" : `Incorrect. Correct answer: ${feedback.correctText}`}
          </p>
          {feedback.explanation && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{feedback.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
