import { useEffect, useState } from "react";

export type LocalMediaError = "permission-denied" | "no-device" | "unknown";

interface UseLocalMediaResult {
  stream: MediaStream | null;
  error: LocalMediaError | null;
  loading: boolean;
}

interface UseLocalMediaOptions {
  audio?: boolean;
  video?: boolean;
}

export function useLocalMedia(options: UseLocalMediaOptions = {}): UseLocalMediaResult {
  const { audio = true, video = false } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<LocalMediaError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let mediaStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio,
          video,
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
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [audio, video]);

  return { stream, error, loading };
}
