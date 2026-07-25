import { TOPICS, type Topic } from "@/lib/quiz/constants";

interface TopicSelectProps {
  value: Topic;
  onChange: (value: Topic) => void;
}

export function TopicSelect({ value, onChange }: TopicSelectProps) {
  return (
    <div>
      <label htmlFor="topic" className="mb-1 block text-sm font-medium">
        Topic
      </label>
      <select
        id="topic"
        value={value}
        onChange={(e) => onChange(e.target.value as Topic)}
        className="w-full rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-black"
      >
        {TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
