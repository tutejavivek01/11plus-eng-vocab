import { CORRECT_CHIP_CLASS, INCORRECT_CHIP_CLASS } from "@/lib/ui/statusColors";

export function WordStatusBadge({ correct }: { correct: boolean }) {
  const chipClass = correct ? CORRECT_CHIP_CLASS : INCORRECT_CHIP_CLASS;
  const emoji = correct ? "😊" : "😞";
  const label = correct ? "Last attempt correct" : "Last attempt incorrect";

  return (
    <span
      role="img"
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full border text-base leading-none ${chipClass}`}
    >
      {emoji}
    </span>
  );
}
