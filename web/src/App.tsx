import { useEffect, useState } from "react";

type ApiStatus = "loading" | "ok" | "error";

function App() {
  const [status, setStatus] = useState<ApiStatus>("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((data) => setStatus(data.status === "ok" ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <h1 className="text-xl font-semibold text-slate-800">BandUp Lab</h1>
        <p className="mt-2 text-slate-600">API 상태: {status}</p>
      </div>
    </main>
  );
}

export default App;
