import { useParams } from "react-router-dom";
import { useState } from "react";
import { useLocalMedia } from "../hooks/useLocalMedia";
import { Lobby } from "../components/Lobby";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const { stream, error: mediaError, loading: mediaLoading } = useLocalMedia();
  const [joined, setJoined] = useState(false);

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Invalid room ID</p>
      </div>
    );
  }

  if (!joined) {
    return (
      <Lobby
        roomId={roomId}
        stream={stream}
        loading={mediaLoading}
        error={mediaError && formatMediaError(mediaError)}
        onJoin={() => {
          setJoined(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
      <h1 className="text-3xl font-bold">In call: {roomId}</h1>
      <p className="text-slate-400">Placeholder for in-call UI</p>
    </div>
  );
}

function formatMediaError(error: string | null): string | null {
  if (!error) {
    return null;
  }
  switch (error) {
    case "permission-denied":
      return "Microphone access denied. Please allow microphone access and try again.";
    case "no-device":
      return "No microphone device found. Please check your hardware.";
    case "unknown":
      return "Failed to access microphone. Please try again.";
    default:
      return null;
  }
}
