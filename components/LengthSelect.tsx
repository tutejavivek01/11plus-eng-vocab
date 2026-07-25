import { ALLOWED_QUIZ_LENGTHS, type QuizLength } from "@/lib/quiz/constants";

interface LengthSelectProps {
  value: QuizLength;
  onChange: (value: QuizLength) => void;
}

export function LengthSelect({ value, onChange }: LengthSelectProps) {
  return (
    <div>
      <label htmlFor="length" className="mb-1 block text-sm font-medium">
        Number of questions
      </label>
      <select
        id="length"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as QuizLength)}
        className="w-full rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
      >
        {ALLOWED_QUIZ_LENGTHS.map((len) => (
          <option key={len} value={len}>
            {len}
          </option>
        ))}
      </select>
    </div>
  );
}
