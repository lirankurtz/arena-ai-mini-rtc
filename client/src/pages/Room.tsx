import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocalMedia } from "../hooks/useLocalMedia";
import { useSignaling } from "../hooks/useSignaling";
import { usePeerConnection } from "../hooks/usePeerConnection";
import { Lobby } from "../components/Lobby";
import { InCall } from "../components/InCall";
import { ErrorBanner } from "../components/ErrorBanner";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [videoEnabled, setVideoEnabled] = useState(false);
  const { stream, error: mediaError, loading: mediaLoading } = useLocalMedia({
    audio: true,
    video: videoEnabled,
  });
  const [joined, setJoined] = useState(false);
  const [remotePeer, setRemotePeer] = useState<string | null>(null);

  const { connected, error: signalingError, peers, offer, answer, iceCandidate, sendJoin, sendOffer, sendAnswer, sendIceCandidate, clearOffer, clearAnswer, clearIceCandidate } = useSignaling();
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  const getDisplayedError = () => {
    if (mediaError && !dismissedErrors.has("media")) {
      return { type: "media" as const, message: formatMediaError(mediaError)! };
    }
    if (signalingError && !dismissedErrors.has("signaling")) {
      const messages: Record<string, string> = {
        "room-full": "Room is full. Unable to join.",
        "invalid-room": "Invalid room ID.",
        "connection-failed": "WebSocket connection failed.",
        "already-joined": "Already joined this room.",
      };
      return { type: "signaling" as const, message: messages[signalingError] || signalingError };
    }
    return null;
  };

  const displayedError = getDisplayedError();

  const handleDismissError = () => {
    if (displayedError) {
      setDismissedErrors((prev) => new Set([...prev, displayedError.type]));
    }
  };

  const { pc, connectionState, remoteStream, createOffer, createAnswer, setRemoteDescription, addIceCandidate } = usePeerConnection(stream, {
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
      <div className="min-h-screen flex flex-col">
        {displayedError && (
          <div className="p-4 bg-slate-900">
            <ErrorBanner
              message={displayedError.message}
              onDismiss={handleDismissError}
            />
          </div>
        )}
        <Lobby
          roomId={roomId}
          stream={stream}
          loading={mediaLoading}
          error={null}
          videoEnabled={videoEnabled}
          onVideoToggle={setVideoEnabled}
          onJoin={() => {
            setJoined(true);
          }}
        />
      </div>
    );
  }

  const handleAudioToggle = (enabled: boolean) => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  };

  const handleVideoToggle = (enabled: boolean) => {
    setVideoEnabled(enabled);
  };

  return (
    <InCall
      roomId={roomId}
      localStream={stream}
      remoteStream={remoteStream}
      connectionState={connectionState}
      error={displayedError?.message}
      onDismissError={handleDismissError}
      audioEnabled={true}
      videoEnabled={videoEnabled}
      onAudioToggle={handleAudioToggle}
      onVideoToggle={handleVideoToggle}
    />
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
