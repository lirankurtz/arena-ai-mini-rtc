import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

export default function Home() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = nanoid();
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-slate-900 text-slate-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2">MiniRTC</h1>
        <p className="text-slate-400 text-lg">1:1 audio/video calling</p>
      </div>

      <button
        onClick={handleCreateRoom}
        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition-colors text-lg"
      >
        Create Room
      </button>

      <p className="text-slate-500 text-sm mt-8 max-w-md text-center">
        Create a new room to get a shareable link. Send the link to someone to start a call.
      </p>
    </div>
  );
}
