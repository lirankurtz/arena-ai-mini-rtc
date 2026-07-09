import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AudioIndicator } from "./AudioIndicator";
import { ShareLink } from "./ShareLink";

interface LobbyProps {
  roomId: string;
  stream: MediaStream | null;
  loading: boolean;
  onJoin: () => void;
  joinDisabled?: boolean;
  error?: string | null;
  videoEnabled?: boolean;
  onVideoToggle?: (enabled: boolean) => void;
  roomFull?: boolean;
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
  roomFull = false,
}: LobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && stream instanceof MediaStream && videoEnabled) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoEnabled]);

  const isJoinDisabled = joinDisabled || loading;

  if (roomFull) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-slate-100 p-4">
        <div className="text-center flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold mb-2">This call is full</h1>
          <p className="text-slate-400 max-w-sm">
            Someone is already in this room. A MiniRTC call only fits two people.
          </p>
        </div>
        <Link
          to="/"
          className="px-8 py-3 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-slate-100 p-4">
      <div className="text-center flex flex-col items-center gap-3">
        <h1 className="text-4xl font-bold mb-2">Set up your call</h1>
        <p className="text-slate-400 text-sm">Share this link to invite someone:</p>
        <ShareLink roomId={roomId} />
      </div>

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
