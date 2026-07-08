import { useCallback, useEffect, useRef, useState } from "react";

export type RTCConnectionState = RTCPeerConnectionState;

export interface UsePeerConnectionHandlers {
  onIceCandidate?: (candidate: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

interface UsePeerConnectionResult {
  pc: RTCPeerConnection | null;
  connectionState: RTCConnectionState;
  remoteStream: MediaStream | null;
  createOffer: () => Promise<string>;
  createAnswer: () => Promise<string>;
  setRemoteDescription: (type: "offer" | "answer", sdp: string) => Promise<void>;
  addIceCandidate: (candidate: string) => Promise<void>;
  resetConnection: () => void;
}

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function usePeerConnection(
  localStream: MediaStream | null,
  handlers: UsePeerConnectionHandlers
): UsePeerConnectionResult {
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCConnectionState>("new");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const handlersRef = useRef(handlers);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    let mounted = true;

    const createPeerConnection = () => {
      const peerConnection = new RTCPeerConnection({
        iceServers: STUN_SERVERS,
      });

      peerConnection.onconnectionstatechange = () => {
        if (mounted) {
          setConnectionState(peerConnection.connectionState);
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          handlersRef.current.onIceCandidate?.(JSON.stringify(event.candidate.toJSON()));
        }
      };

      peerConnection.ontrack = (event) => {
        if (mounted) {
          if (!remoteStreamRef.current) {
            const newRemoteStream = new MediaStream();
            newRemoteStream.addTrack(event.track);
            remoteStreamRef.current = newRemoteStream;
            setRemoteStream(newRemoteStream);
            handlersRef.current.onRemoteStream?.(newRemoteStream);
          } else {
            remoteStreamRef.current.addTrack(event.track);
          }
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      if (mounted) {
        setPc(peerConnection);
      }

      return peerConnection;
    };

    const peerConnection = createPeerConnection();

    return () => {
      mounted = false;
      peerConnection.close();
    };
  }, [localStream, resetKey]);

  const createOffer = useCallback(async (): Promise<string> => {
    if (!pc) {
      throw new Error("PeerConnection not initialized");
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer.sdp || "";
  }, [pc]);

  const createAnswer = useCallback(async (): Promise<string> => {
    if (!pc) {
      throw new Error("PeerConnection not initialized");
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer.sdp || "";
  }, [pc]);

  const setRemoteDescription = useCallback(
    async (type: "offer" | "answer", sdp: string) => {
      if (!pc) {
        throw new Error("PeerConnection not initialized");
      }

      const description = new RTCSessionDescription({ type, sdp });
      await pc.setRemoteDescription(description);
    },
    [pc]
  );

  // Tear down the current peer connection and spin up a fresh one, clearing the
  // remote stream. Used when a peer leaves so a subsequent rejoin negotiates on
  // a clean RTCPeerConnection instead of a stale, already-closed session.
  const resetConnection = useCallback(() => {
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    setRemoteStream(null);
    setConnectionState("new");
    setResetKey((k) => k + 1);
  }, []);

  const addIceCandidate = useCallback(
    async (candidateJson: string) => {
      if (!pc) {
        throw new Error("PeerConnection not initialized");
      }

      const candidateObj = JSON.parse(candidateJson);
      const candidate = new RTCIceCandidate(candidateObj);
      await pc.addIceCandidate(candidate);
    },
    [pc]
  );

  return {
    pc,
    connectionState,
    remoteStream,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    resetConnection,
  };
}
