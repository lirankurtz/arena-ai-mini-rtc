import { useEffect, useRef, useState } from "react";
import { AudioIndicator } from "./AudioIndicator";

interface LobbyProps {
  roomId: string;
  stream: MediaStream | null;
  loading: boolean;
  onJoin: () => void;
  joinDisabled?: boolean;
  error?: string | null;
  videoEnabled?: boolean;
  onVideoToggle?: (enabled: boolean) => void;
}

export function Lobby({
  roomId,
  stream,
  loading,
  onJoin,
  joinDisabled = false,
  error,
  videoEnabled = false,
  onVideoToggle,
}: LobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [probeLoading, setProbeLoading] = useState(true);
  const [roomFull, setRoomFull] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && stream && stream instanceof MediaStream && videoEnabled) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoEnabled]);

  useEffect(() => {
    let mounted = true;

    const checkAvailability = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/available`);
        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setProbeError("Failed to check room availability");
          return;
        }

        const data = await response.json();
        setRoomFull(!data.available);
        setProbeError(null);
      } catch {
        if (mounted) {
          setProbeError("Network error checking availability");
        }
      } finally {
        if (mounted) {
          setProbeLoading(false);
        }
      }
    };

    checkAvailability();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  const isJoinDisabled = joinDisabled || roomFull || loading || probeLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-slate-100 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Ready to join?</h1>
        <p className="text-slate-400">Room ID: {roomId}</p>
      </div>

      {probeLoading && (
        <div className="text-slate-400">Checking room availability...</div>
      )}

      {roomFull && (
        <div className="bg-red-900 text-red-100 px-6 py-3 rounded-lg">
          Room is full. Unable to join.
        </div>
      )}

      {probeError && (
        <div className="bg-yellow-900 text-yellow-100 px-6 py-3 rounded-lg">
          {probeError}
        </div>
      )}

      {error && (
        <div className="bg-red-900 text-red-100 px-6 py-3 rounded-lg">
          {error}
        </div>
      )}

      {stream && (
        <div className="flex flex-col gap-4 items-center">
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg w-80 h-60 relative group">
            {videoEnabled ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                <button
                  onClick={() => onVideoToggle?.(false)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Disable camera"
                >
                  🎥
                </button>
              </>
            ) : (
              <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-center gap-3">
                <div className="text-4xl opacity-50">📷</div>
                <div className="text-sm text-slate-400">Camera disabled</div>
                <button
                  onClick={() => onVideoToggle?.(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-xs text-white transition-colors"
                >
                  Enable
                </button>
              </div>
            )}
          </div>

          <AudioIndicator stream={stream} />
        </div>
      )}

      {!stream && !loading && (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400">No microphone access yet</p>
        </div>
      )}

      {loading && (
        <div className="text-slate-400">Requesting microphone access...</div>
      )}

      <button
        onClick={onJoin}
        disabled={isJoinDisabled}
        className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
          isJoinDisabled
            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
      >
        {loading ? "Requesting access..." : "Join call"}
      </button>
    </div>
  );
}
