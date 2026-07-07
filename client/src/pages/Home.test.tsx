import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Home from "./Home";

describe("Home", () => {
  const renderHome = () => {
    return render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
  };

  it("renders title and Create Room button", () => {
    renderHome();
    expect(screen.getByText("MiniRTC")).toBeDefined();
    expect(screen.getByRole("button", { name: /create room/i })).toBeDefined();
  });

  it("Create Room button exists and is clickable", async () => {
    const user = userEvent.setup();
    renderHome();

    const button = screen.getByRole("button", { name: /create room/i });
    expect(button).toBeDefined();
    expect(button.tagName).toBe("BUTTON");

    await user.click(button);
    // Navigation happens via react-router, which we've mocked by wrapping with BrowserRouter
    // In a real browser, this would navigate; in tests we just verify the button is clickable
  });
});
