"use client";

import { useState, type ReactNode } from "react";

export interface WordHistoryTab {
  value: string;
  label: string;
  content: ReactNode;
}

export function WordHistoryTabs({ tabs }: { tabs: WordHistoryTab[] }) {
  const [active, setActive] = useState(tabs[0]?.value);

  return (
    <div>
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto border-b border-black/[.08] dark:border-white/[.145]"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={tab.value === active}
            onClick={() => setActive(tab.value)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium ${
              tab.value === active
                ? "border-b-2 border-foreground"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.map((tab) => (
          <div key={tab.value} role="tabpanel" hidden={tab.value !== active}>
            {tab.value === active && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
