import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

export default function Home() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = nanoid();
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-slate-100">
      <h1 className="text-4xl font-bold">MiniRTC</h1>
      <p className="text-slate-400 text-lg">1:1 audio/video calling</p>
      <button
        onClick={handleCreateRoom}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-white transition-colors"
      >
        Create Room
      </button>
    </div>
  );
}
