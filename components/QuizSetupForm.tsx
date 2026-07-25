"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TopicSelect } from "@/components/TopicSelect";
import { LengthSelect } from "@/components/LengthSelect";
import { TOPICS, ALLOWED_QUIZ_LENGTHS, type Topic, type QuizLength } from "@/lib/quiz/constants";

export function QuizSetupForm() {
  const router = useRouter();
  const [topic, setTopic] = useState<Topic>(TOPICS[0].value);
  const [length, setLength] = useState<QuizLength>(ALLOWED_QUIZ_LENGTHS[0]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ topic, length: String(length) });
    router.push(`/quiz/play?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <TopicSelect value={topic} onChange={setTopic} />
      <LengthSelect value={length} onChange={setLength} />
      <button
        type="submit"
        className="w-full rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Start quiz
      </button>
    </form>
  );
}
