import type { GeneratedQuestion } from "@/lib/quiz/generateQuiz";

interface QuestionCardProps {
  question: GeneratedQuestion;
  selected: string | null;
  feedback: { isCorrect: boolean; correctText: string } | null;
  onSelect: (option: string) => void;
}

export function QuestionCard({ question, selected, feedback, onSelect }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{question.prompt}</h2>
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selected === option;
          const isCorrectOption = feedback !== null && option === feedback.correctText;
          const isWrongSelected = feedback !== null && isSelected && !feedback.isCorrect;

          let className =
            "w-full rounded border px-4 py-3 text-left transition-colors border-black/[.15] dark:border-white/[.2]";
          if (feedback) {
            if (isCorrectOption) {
              className += " bg-green-100 border-green-500 dark:bg-green-900/40";
            } else if (isWrongSelected) {
              className += " bg-red-100 border-red-500 dark:bg-red-900/40";
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
              {option}
            </button>
          );
        })}
      </div>
      {feedback && (
        <p
          className={
            feedback.isCorrect
              ? "font-medium text-green-700 dark:text-green-400"
              : "font-medium text-red-700 dark:text-red-400"
          }
        >
          {feedback.isCorrect ? "Correct!" : `Incorrect. Correct answer: ${feedback.correctText}`}
        </p>
      )}
    </div>
  );
}
