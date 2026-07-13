import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Lobby } from "./Lobby";

describe("Lobby", () => {
  it("renders room ID and join prompt", () => {
    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText("Set up your call")).toBeDefined();
    expect(screen.getByText(/room\/test123456789012345/)).toBeDefined();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("shows room-full message when room is unavailable", () => {
    render(
      <BrowserRouter>
        <Lobby
          roomId="test123456789012345"
          stream={null}
          loading={false}
          onJoin={vi.fn()}
          roomFull={true}
        />
      </BrowserRouter>
    );

    expect(screen.getByText("This call is full")).toBeDefined();
    expect(screen.getByText(/Someone is already in this room/)).toBeDefined();
  });

  it("redirects to home when room is full", () => {
    render(
      <BrowserRouter>
        <Lobby
          roomId="test123456789012345"
          stream={null}
          loading={false}
          onJoin={vi.fn()}
          roomFull={true}
        />
      </BrowserRouter>
    );

    const link = screen.getByRole("link", { name: /Back to home/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/");
  });

  it("renders without error when stream is available", () => {
    const mockStream = {} as MediaStream;

    render(
      <Lobby
        roomId="test123456789012345"
        stream={mockStream}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText("Set up your call")).toBeDefined();
  });

  it("calls onJoin when Join button is clicked", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={onJoin}
      />
    );

    const button = screen.getByRole("button", { name: /join call/i });
    await user.click(button);

    expect(onJoin).toHaveBeenCalled();
  });

  it("disables Join button when loading", () => {
    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={true}
        onJoin={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: /Requesting access/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("displays error message when passed", () => {
    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
        error="Microphone access denied"
      />
    );

    expect(screen.getByText("Microphone access denied")).toBeDefined();
  });
});
