import { useCallback, useEffect, useRef, useState } from "react";
import { ClientMessage, ServerMessage } from "@mini-rtc/shared";

export type SignalingError = "connection-failed" | "already-joined" | "invalid-room" | "room-full";

export interface SignalingHandlers {
  onJoined?: (selfId: string, peers: string[]) => void;
  onPeerJoined?: (peerId: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onOffer?: (sdp: string, from: string) => void;
  onAnswer?: (sdp: string, from: string) => void;
  onIceCandidate?: (candidate: string, from: string) => void;
  onError?: (code: SignalingError, message: string) => void;
}

interface UseSignalingResult {
  connected: boolean;
  error: SignalingError | null;
  sendJoin: (roomId: string) => void;
  sendOffer: (sdp: string) => void;
  sendAnswer: (sdp: string) => void;
  sendIceCandidate: (candidate: string) => void;
  leave: () => void;
}

export function useSignaling(handlers: SignalingHandlers): UseSignalingResult {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<SignalingError | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    const h = handlersRef.current;

    switch (msg.type) {
      case "joined":
        h.onJoined?.(msg.selfId, msg.peers);
        break;
      case "peer-joined":
        h.onPeerJoined?.(msg.peerId);
        break;
      case "peer-left":
        h.onPeerLeft?.(msg.peerId);
        break;
      case "offer":
        h.onOffer?.(msg.sdp, msg.from);
        break;
      case "answer":
        h.onAnswer?.(msg.sdp, msg.from);
        break;
      case "ice-candidate":
        h.onIceCandidate?.(msg.candidate, msg.from);
        break;
      case "error":
        const errorCode = msg.code as SignalingError;
        h.onError?.(errorCode, msg.message);
        break;
    }
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const sendJoin = useCallback(
    (roomId: string) => {
      send({ type: "join", roomId });
    },
    [send]
  );

  const sendOffer = useCallback(
    (sdp: string) => {
      send({ type: "offer", sdp });
    },
    [send]
  );

  const sendAnswer = useCallback(
    (sdp: string) => {
      send({ type: "answer", sdp });
    },
    [send]
  );

  const sendIceCandidate = useCallback(
    (candidate: string) => {
      send({ type: "ice-candidate", candidate });
    },
    [send]
  );

  const leave = useCallback(() => {
    send({ type: "leave" });
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, [send]);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.onopen = () => {
          if (mounted) {
            setConnected(true);
            setError(null);
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as ServerMessage;
            handleMessage(msg);
          } catch (err) {
            console.error("Failed to parse message:", err);
          }
        };

        ws.onclose = () => {
          if (mounted) {
            setConnected(false);
          }
        };

        ws.onerror = () => {
          if (mounted) {
            setError("connection-failed");
            setConnected(false);
          }
        };

        wsRef.current = ws;
      } catch (err) {
        if (mounted) {
          setError("connection-failed");
          setConnected(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [handleMessage]);

  return {
    connected,
    error,
    sendJoin,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    leave,
  };
}
