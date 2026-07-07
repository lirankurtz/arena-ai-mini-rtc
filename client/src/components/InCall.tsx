import { useEffect, useRef, useState } from "react";
import { ErrorBanner } from "./ErrorBanner";

interface InCallProps {
  roomId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState?: RTCPeerConnectionState;
  error?: string | null;
  onDismissError?: () => void;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  onAudioToggle?: (enabled: boolean) => void;
  onVideoToggle?: (enabled: boolean) => void;
  onLeave?: () => void;
}

export function InCall({
  roomId,
  localStream,
  remoteStream,
  connectionState = "new",
  error,
  onDismissError,
  audioEnabled = true,
  videoEnabled = false,
  onAudioToggle,
  onVideoToggle,
  onLeave,
}: InCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(audioEnabled);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(videoEnabled);

  useEffect(() => {
    if (localVideoRef.current && localStream && localStream instanceof MediaStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && remoteStream instanceof MediaStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = localAudioEnabled;
      });
    }
  }, [localStream, localAudioEnabled]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = localVideoEnabled;
      });
    }
  }, [localStream, localVideoEnabled]);

  const handleAudioToggle = () => {
    const newState = !localAudioEnabled;
    setLocalAudioEnabled(newState);
    onAudioToggle?.(newState);
  };

  const handleVideoToggle = () => {
    const newState = !localVideoEnabled;
    setLocalVideoEnabled(newState);
    onVideoToggle?.(newState);
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case "connected":
        return "bg-emerald-600";
      case "connecting":
        return "bg-yellow-600";
      case "disconnected":
      case "failed":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      case "failed":
        return "Connection failed";
      default:
        return "Initializing";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {error && (
        <div className="p-4 bg-slate-900 border-b border-slate-700">
          <ErrorBanner
            message={error}
            onDismiss={onDismissError}
          />
        </div>
      )}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Room: {roomId}</h1>
        <div className={`${getStatusColor()} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {getStatusText()}
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        <div className="flex-1 flex flex-col">
          <div className="text-sm text-slate-400 mb-2">Remote video</div>
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-slate-500">Waiting for remote video...</div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex flex-col">
          <div className="text-sm text-slate-400 mb-2">You</div>
          <div className="w-80 h-60 bg-black rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-slate-500">No video</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 bg-slate-800 px-4 py-3 flex justify-center gap-4">
        <button
          onClick={handleAudioToggle}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            localAudioEnabled
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {localAudioEnabled ? "🎙️ Mute" : "🔇 Unmute"}
        </button>

        <button
          onClick={handleVideoToggle}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            localVideoEnabled
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {localVideoEnabled ? "📹 Stop video" : "📹 Start video"}
        </button>

        <button
          onClick={onLeave}
          className="px-6 py-2 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          📞 Leave call
        </button>
      </div>
    </div>
  );
}
