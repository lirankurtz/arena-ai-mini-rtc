import { useEffect, useState } from "react";

interface UseRoomAvailabilityResult {
  available: boolean | null;
  loading: boolean;
  error: string | null;
}

export function useRoomAvailability(roomId: string): UseRoomAvailabilityResult {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const check = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/available`);
        if (!mounted) return;

        if (!response.ok) {
          setError("Failed to check room availability");
          return;
        }

        const data = await response.json();
        setAvailable(Boolean(data.available));
        setError(null);
      } catch {
        if (mounted) {
          setError("Network error checking availability");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  return { available, loading, error };
}
