import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Lobby } from "./Lobby";

describe("Lobby", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders room ID and join prompt", () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText("Ready to join?")).toBeDefined();
    // Room ID is now surfaced as a shareable link URL.
    expect(screen.getByText(/room\/test123456789012345/)).toBeDefined();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("calls availability probe on mount", () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/rooms/test123456789012345/available");
  });

  it("shows room-full message when room is unavailable", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: false }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Room is full. Unable to join.")).toBeDefined();
    });
  });

  it("disables Join button when room is full", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: false }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /join call/i });
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  it("shows probe error when fetch fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error checking availability/)).toBeDefined();
    });
  });

  it("renders without error when stream is available", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    const mockStream = {} as MediaStream;

    render(
      <Lobby
        roomId="test123456789012345"
        stream={mockStream}
        loading={false}
        onJoin={vi.fn()}
      />
    );

    // Component should render without throwing
    expect(screen.getByText("Ready to join?")).toBeDefined();
  });

  it("calls onJoin when Join button is clicked", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={onJoin}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /join call/i });
      expect(button).toBeDefined();
    });

    const button = screen.getByRole("button", { name: /join call/i });
    await user.click(button);

    expect(onJoin).toHaveBeenCalled();
  });

  it("disables Join button when loading", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={true}
        onJoin={vi.fn()}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /Requesting access/i });
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  it("displays error message when passed", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <Lobby
        roomId="test123456789012345"
        stream={null}
        loading={false}
        onJoin={vi.fn()}
        error="Microphone access denied"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Microphone access denied")).toBeDefined();
    });
  });
});
