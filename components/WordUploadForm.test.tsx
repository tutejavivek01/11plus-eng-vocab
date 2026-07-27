import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WordUploadForm } from "./WordUploadForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("WordUploadForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    refresh.mockClear();
  });

  it("shows a collapsed toggle button by default", () => {
    render(<WordUploadForm />);
    expect(screen.getByRole("button", { name: "+ Add a word" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Word")).not.toBeInTheDocument();
  });

  it("expands the form when the toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(<WordUploadForm />);
    await user.click(screen.getByRole("button", { name: "+ Add a word" }));
    expect(screen.getByText("Add a new word")).toBeInTheDocument();
  });

  it("submits the form, shows a success message, and refreshes the router", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "w1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<WordUploadForm />);
    await user.click(screen.getByRole("button", { name: "+ Add a word" }));
    await user.type(screen.getByText("Word").closest("label")!.querySelector("input")!, "Serene");
    await user.type(
      screen.getByText("Definition").closest("label")!.querySelector("textarea")!,
      "calm and peaceful"
    );
    await user.click(screen.getByRole("button", { name: "Add word" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dictionary/words",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText('"Serene" added to the dictionary.')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an error message when the API call fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Word and definition are required" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<WordUploadForm />);
    await user.click(screen.getByRole("button", { name: "+ Add a word" }));
    await user.type(screen.getByText("Word").closest("label")!.querySelector("input")!, "X");
    await user.type(
      screen.getByText("Definition").closest("label")!.querySelector("textarea")!,
      "Y"
    );
    await user.click(screen.getByRole("button", { name: "Add word" }));

    expect(await screen.findByText("Word and definition are required")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
