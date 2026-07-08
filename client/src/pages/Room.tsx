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

  const { connected, error: signalingError, initialPeers, offer, answer, iceCandidate, peerLeft, sendJoin, sendOffer, sendAnswer, sendIceCandidate, clearOffer, clearAnswer, clearIceCandidate, clearPeerLeft, leave } = useSignaling();
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

  const { pc, connectionState, remoteStream, createOffer, createAnswer, setRemoteDescription, addIceCandidate, resetConnection } = usePeerConnection(stream, {
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
    if (offer && pc) {
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
  }, [offer, pc, setRemoteDescription, createAnswer, sendAnswer, clearOffer]);

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
    if (peerLeft) {
      resetConnection();
      setRemotePeer(null);
      clearPeerLeft();
    }
  }, [peerLeft, resetConnection, clearPeerLeft]);

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
    if (joined && pc && initialPeers.length > 0 && !remotePeer) {
      const peerId = initialPeers[0];
      setRemotePeer(peerId);
      createOffer()
        .then((offer) => {
          sendOffer(offer);
        })
        .catch((err) => {
          console.error("Failed to create offer:", err);
          setRemotePeer(null);
        });
    }
  }, [joined, pc, initialPeers.length, remotePeer, createOffer, sendOffer]);

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

  const handleLeave = () => {
    // Leave the room but keep local media (for the lobby preview / rejoin) and
    // the signaling socket open. Reset the peer connection so a rejoin gets a
    // fresh negotiation. Local tracks are stopped on unmount by useLocalMedia.
    leave();
    resetConnection();
    setRemotePeer(null);
    setJoined(false);
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
      onLeave={handleLeave}
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
