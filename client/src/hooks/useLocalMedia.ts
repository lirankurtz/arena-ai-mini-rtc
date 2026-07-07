import { useEffect, useState } from "react";

export type LocalMediaError = "permission-denied" | "no-device" | "unknown";

interface UseLocalMediaResult {
  stream: MediaStream | null;
  error: LocalMediaError | null;
  loading: boolean;
}

export function useLocalMedia(): UseLocalMediaResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<LocalMediaError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        if (mounted) {
          setStream(mediaStream);
          setError(null);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setError("permission-denied");
          } else if (err.name === "NotFoundError") {
            setError("no-device");
          } else {
            setError("unknown");
          }
        } else {
          setError("unknown");
        }
        setStream(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getMedia();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return { stream, error, loading };
}
