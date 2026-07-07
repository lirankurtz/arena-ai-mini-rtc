import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocalMedia } from "../hooks/useLocalMedia";
import { useSignaling, SignalingError } from "../hooks/useSignaling";
import { usePeerConnection } from "../hooks/usePeerConnection";
import { Lobby } from "../components/Lobby";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [videoEnabled, setVideoEnabled] = useState(false);
  const { stream, error: mediaError, loading: mediaLoading } = useLocalMedia({
    audio: true,
    video: videoEnabled,
  });
  const [joined, setJoined] = useState(false);
  const [remotePeer, setRemotePeer] = useState<string | null>(null);

  const { connected, error, peers, offer, answer, iceCandidate, sendJoin, sendOffer, sendAnswer, sendIceCandidate, clearOffer, clearAnswer, clearIceCandidate } = useSignaling();

  const { pc, remoteStream, createOffer, createAnswer, setRemoteDescription, addIceCandidate } = usePeerConnection(stream, {
    onIceCandidate: (candidate) => {
      sendIceCandidate(candidate);
    },
  });

  useEffect(() => {
    if (joined && connected && stream) {
      sendJoin(roomId!);
    }
  }, [joined, connected, roomId, stream, sendJoin]);

  useEffect(() => {
    if (offer) {
      setRemotePeer(offer.from);
      setRemoteDescription("offer", offer.sdp)
        .then(() => createAnswer())
        .then((answer) => {
          sendAnswer(answer);
          clearOffer();
        })
        .catch((err) => {
          console.error("Failed to handle offer:", err);
        });
    }
  }, [offer, setRemoteDescription, createAnswer, sendAnswer, clearOffer]);

  useEffect(() => {
    if (answer) {
      setRemoteDescription("answer", answer.sdp)
        .then(() => clearAnswer())
        .catch((err) => {
          console.error("Failed to handle answer:", err);
        });
    }
  }, [answer, setRemoteDescription, clearAnswer]);

  useEffect(() => {
    if (iceCandidate) {
      addIceCandidate(iceCandidate.candidate)
        .then(() => clearIceCandidate())
        .catch((err) => {
          console.error("Failed to add ICE candidate:", err);
        });
    }
  }, [iceCandidate, addIceCandidate, clearIceCandidate]);

  useEffect(() => {
    if (peers.length > 0 && pc && !remotePeer) {
      createOffer()
        .then((offer) => {
          sendOffer(offer);
        })
        .catch((err) => {
          console.error("Failed to create offer:", err);
        });
    }
  }, [peers.length, pc, remotePeer, createOffer, sendOffer]);

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
        videoEnabled={videoEnabled}
        onVideoToggle={setVideoEnabled}
        onJoin={() => {
          setJoined(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
      <h1 className="text-3xl font-bold">In call: {roomId}</h1>
      {error && (
        <div className="bg-red-900 text-red-100 px-6 py-3 rounded-lg">
          Error: {error}
        </div>
      )}
      {!connected && (
        <p className="text-slate-400">Connecting...</p>
      )}
      {remotePeer && (
        <p className="text-slate-400">Connected to: {remotePeer}</p>
      )}
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
