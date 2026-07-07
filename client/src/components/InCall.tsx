import { useEffect, useRef } from "react";

interface InCallProps {
  roomId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export function InCall({ roomId, localStream, remoteStream }: InCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && localStream instanceof MediaStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && remoteStream instanceof MediaStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Room: {roomId}</h1>
      </div>

      <div className="flex-1 flex gap-4">
        <div className="flex-1 flex flex-col">
          <div className="text-sm text-slate-400 mb-2">Remote video</div>
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-slate-500">Waiting for remote video...</div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex flex-col">
          <div className="text-sm text-slate-400 mb-2">You</div>
          <div className="w-80 h-60 bg-black rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-slate-500">No video</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
