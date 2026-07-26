import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BACKGROUND_PRESETS } from "@/lib/theme/presets";
import { BackgroundColorPicker } from "./BackgroundColorPicker";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("BackgroundColorPicker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    refresh.mockClear();
  });

  it("renders one swatch button per preset plus a Default option", () => {
    render(<BackgroundColorPicker initialBackgroundColor={null} />);
    expect(screen.getByRole("button", { name: /Default/ })).toBeInTheDocument();
    for (const preset of BACKGROUND_PRESETS) {
      expect(screen.getByRole("button", { name: new RegExp(preset.label) })).toBeInTheDocument();
    }
  });

  it("PATCHes the chosen preset and refreshes the router", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<BackgroundColorPicker initialBackgroundColor={null} />);
    await user.click(screen.getByRole("button", { name: /Sunrise/ }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/preferences",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ backgroundColor: "sunrise" }),
      })
    );
    expect(refresh).toHaveBeenCalled();
  });
});
