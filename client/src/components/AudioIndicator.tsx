import { useEffect, useRef, useState } from "react";

interface AudioIndicatorProps {
  stream: MediaStream;
}

const MAX_DASHES = 5;

export function AudioIndicator({ stream }: AudioIndicatorProps) {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    try {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) {
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(average / 100, 1);

        setLevel(Math.round(normalized * MAX_DASHES));
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      animationRef.current = requestAnimationFrame(updateLevel);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      };
    } catch (err) {
      console.error("Failed to initialize audio context:", err);
      return;
    }
  }, [stream]);

  const dashes = Array(MAX_DASHES)
    .fill(null)
    .map((_, i) => (i < level ? "—" : "—"))
    .join("");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎙️</span>
        <div className="text-xl font-mono tracking-wider">
          <span className="text-emerald-500">{dashes.substring(0, level * 2)}</span>
          <span className="text-slate-500">{dashes.substring(level * 2)}</span>
        </div>
      </div>
      <p className="text-sm text-slate-400">Microphone active</p>
    </div>
  );
}
