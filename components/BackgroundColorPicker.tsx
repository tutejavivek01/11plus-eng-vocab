"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BACKGROUND_PRESETS } from "@/lib/theme/presets";

export function BackgroundColorPicker({
  initialBackgroundColor,
}: {
  initialBackgroundColor: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialBackgroundColor);
  const [saving, setSaving] = useState(false);

  async function choose(backgroundColor: string | null) {
    setSaving(true);
    setSelected(backgroundColor);
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundColor }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => choose(null)}
        disabled={saving}
        aria-pressed={selected === null}
        className={`flex flex-col items-center gap-1 rounded border p-2 text-xs ${
          selected === null
            ? "border-foreground"
            : "border-black/[.08] dark:border-white/[.145]"
        }`}
      >
        <span className="h-8 w-8 rounded-full border border-black/[.08] bg-background dark:border-white/[.145]" />
        Default
      </button>
      {BACKGROUND_PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => choose(preset.key)}
          disabled={saving}
          aria-pressed={selected === preset.key}
          className={`flex flex-col items-center gap-1 rounded border p-2 text-xs ${
            selected === preset.key
              ? "border-foreground"
              : "border-black/[.08] dark:border-white/[.145]"
          }`}
        >
          <span
            className="h-8 w-8 rounded-full border border-black/[.08] dark:border-white/[.145]"
            style={{ backgroundColor: preset.light }}
          />
          {preset.label}
        </button>
      ))}
    </div>
  );
}
