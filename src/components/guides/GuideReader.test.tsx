import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuideReader } from "./GuideReader";

describe("pembaca panduan", () => {
  it("memfilter panduan dan menampilkan isinya", () => {
    render(<GuideReader guides={[{ id: "1", title: "Panduan misa", content: "Isi panduan" }, { id: "2", title: "Panduan doa", content: "Isi doa" }]} />);
    fireEvent.change(screen.getByLabelText("Cari panduan"), { target: { value: "doa" } });
    fireEvent.click(screen.getByRole("button", { name: "Panduan doa" }));
    expect(screen.getByText("Isi doa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Panduan misa" })).not.toBeInTheDocument();
  });

  it("mencegah penyalinan dan memberi penjelasan", () => {
    render(<GuideReader guides={[{ id: "1", title: "Panduan misa", content: "Isi panduan" }]} />);
    const event = new Event("copy", { bubbles: true, cancelable: true });
    screen.getByText("Isi panduan").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
