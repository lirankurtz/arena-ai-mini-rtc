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
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

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
          if (!remoteStream) {
            const newRemoteStream = new MediaStream();
            newRemoteStream.addTrack(event.track);
            setRemoteStream(newRemoteStream);
            handlersRef.current.onRemoteStream?.(newRemoteStream);
          } else {
            remoteStream.addTrack(event.track);
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
  }, [localStream]);

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
  };
}
