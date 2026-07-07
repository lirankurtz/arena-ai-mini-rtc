import { useCallback, useEffect, useRef, useState } from "react";
import { ClientMessage, ServerMessage } from "@mini-rtc/shared";

export type SignalingError = "connection-failed" | "already-joined" | "invalid-room" | "room-full";

interface UseSignalingResult {
  connected: boolean;
  error: SignalingError | null;
  selfId: string | null;
  peers: string[];
  offer: { sdp: string; from: string } | null;
  answer: { sdp: string; from: string } | null;
  iceCandidate: { candidate: string; from: string } | null;
  sendJoin: (roomId: string) => void;
  sendOffer: (sdp: string) => void;
  sendAnswer: (sdp: string) => void;
  sendIceCandidate: (candidate: string) => void;
  clearOffer: () => void;
  clearAnswer: () => void;
  clearIceCandidate: () => void;
  leave: () => void;
}

export function useSignaling(): UseSignalingResult {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<SignalingError | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [offer, setOffer] = useState<{ sdp: string; from: string } | null>(null);
  const [answer, setAnswer] = useState<{ sdp: string; from: string } | null>(null);
  const [iceCandidate, setIceCandidate] = useState<{ candidate: string; from: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "joined":
        setSelfId(msg.selfId);
        setPeers(msg.peers);
        break;
      case "peer-joined":
        setPeers((prev) => [...prev, msg.peerId]);
        break;
      case "peer-left":
        setPeers((prev) => prev.filter((id) => id !== msg.peerId));
        break;
      case "offer":
        setOffer({ sdp: msg.sdp, from: msg.from });
        break;
      case "answer":
        setAnswer({ sdp: msg.sdp, from: msg.from });
        break;
      case "ice-candidate":
        setIceCandidate({ candidate: msg.candidate, from: msg.from });
        break;
      case "error":
        const errorCode = msg.code as SignalingError;
        setError(errorCode);
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

  const clearOffer = useCallback(() => {
    setOffer(null);
  }, []);

  const clearAnswer = useCallback(() => {
    setAnswer(null);
  }, []);

  const clearIceCandidate = useCallback(() => {
    setIceCandidate(null);
  }, []);

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
    selfId,
    peers,
    offer,
    answer,
    iceCandidate,
    sendJoin,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    clearOffer,
    clearAnswer,
    clearIceCandidate,
    leave,
  };
}
