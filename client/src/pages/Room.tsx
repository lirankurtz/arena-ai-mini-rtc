import { useParams } from "react-router-dom";

export default function Room() {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
      <h1 className="text-3xl font-bold">Room: {id}</h1>
      <p className="text-slate-400">Placeholder for room UI</p>
    </div>
  );
}
