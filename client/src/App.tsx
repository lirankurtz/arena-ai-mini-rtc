import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("loading...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setMessage(data.status))
      .catch(() => setMessage("backend unreachable"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
      <h1 className="text-3xl font-bold">arena-ai-mini-rtc</h1>
      <p className="text-slate-400">
        backend says: <span className="font-mono text-emerald-400">{message}</span>
      </p>
    </div>
  );
}
