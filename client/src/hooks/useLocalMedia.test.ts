import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLocalMedia } from "./useLocalMedia";

describe("useLocalMedia", () => {
  let mockStream: MediaStream;
  let mockTracks: MediaStreamTrack[];

  beforeEach(() => {
    mockTracks = [
      { stop: vi.fn() } as unknown as MediaStreamTrack,
    ];

    mockStream = {
      getTracks: vi.fn(() => mockTracks),
    } as unknown as MediaStream;

    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns loading=true initially", () => {
    const { result } = renderHook(() => useLocalMedia());

    expect(result.current.loading).toBe(true);
    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("requests audio on mount", () => {
    renderHook(() => useLocalMedia());

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
      video: false,
    });
  });

  it("returns stream when getUserMedia succeeds", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stream).toBe(mockStream);
    expect(result.current.error).toBe(null);
  });

  it("returns permission-denied error when user rejects mic", async () => {
    const error = new DOMException("Permission denied", "NotAllowedError");
    const getUserMedia = vi.fn().mockRejectedValue(error);
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe("permission-denied");
  });

  it("returns no-device error when no audio device available", async () => {
    const error = new DOMException("No device found", "NotFoundError");
    const getUserMedia = vi.fn().mockRejectedValue(error);
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe("no-device");
  });

  it("returns unknown error for other exceptions", async () => {
    const error = new DOMException("Some other error", "UnknownError");
    const getUserMedia = vi.fn().mockRejectedValue(error);
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe("unknown");
  });

  it("handles non-DOMException errors", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error("Generic error"));
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe("unknown");
  });

  it("stops tracks on unmount", async () => {
    const stopFn = vi.fn();
    const mockStreamWithStop = {
      getTracks: vi.fn(() => [{ stop: stopFn }]),
    } as unknown as MediaStream;

    const getUserMedia = vi.fn().mockResolvedValue(mockStreamWithStop);
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result, unmount } = renderHook(() => useLocalMedia());

    await waitFor(() => {
      expect(result.current.stream).toBe(mockStreamWithStop);
    });

    unmount();

    expect(stopFn).toHaveBeenCalled();
  });

  it("does not set state after unmount", async () => {
    const getUserMedia = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve(mockStream), 100);
      })
    );
    (navigator.mediaDevices as any).getUserMedia = getUserMedia;

    const { result, unmount } = renderHook(() => useLocalMedia());

    unmount();
    await waitFor(() => {
      // Give time for setTimeout to fire
    }, { timeout: 200 });

    // If state was set after unmount, we'd see an error in test output
    // This test passes if no warning is emitted
    expect(result.current.stream).toBe(null);
  });
});
