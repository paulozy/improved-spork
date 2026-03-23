"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CARD_VALUES } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [yourName, setYourName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim() || !yourName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, cardValues: DEFAULT_CARD_VALUES }),
      });
      const room = await res.json();
      const pid = crypto.randomUUID();
      sessionStorage.setItem("participantId", pid);
      sessionStorage.setItem("participantName", yourName.trim());
      router.push(`/room/${room.id}`);
    } catch {
      setError("Erro ao criar sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !yourName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/room?id=${joinCode.trim().toUpperCase()}`);
      if (!res.ok) { setError("Sala não encontrada."); return; }
      const pid = crypto.randomUUID();
      sessionStorage.setItem("participantId", pid);
      sessionStorage.setItem("participantName", yourName.trim());
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    } catch {
      setError("Erro ao entrar na sala.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center">
            <span className="text-paper font-display font-bold text-lg">SP</span>
          </div>
          <h1 className="font-display text-4xl font-800 text-ink tracking-tight">
            Scrum Poker
          </h1>
        </div>
        <p className="font-body text-muted text-base">
          Estimativas colaborativas, sem ruído, sem ancoragem.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white border border-cream rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-cream">
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 font-display font-600 text-sm uppercase tracking-widest transition-colors ${
                tab === t
                  ? "bg-ink text-paper"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t === "create" ? "Criar Sala" : "Entrar"}
            </button>
          ))}
        </div>

        <form
          onSubmit={tab === "create" ? handleCreate : handleJoin}
          className="p-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs uppercase tracking-widest text-muted">
              Seu nome
            </label>
            <input
              type="text"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="Ex: Ana Silva"
              className="w-full px-4 py-3 bg-paper border border-cream rounded-xl font-body text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors"
              required
            />
          </div>

          {tab === "create" ? (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs uppercase tracking-widest text-muted">
                Nome da sala
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Sprint 42 Planning"
                className="w-full px-4 py-3 bg-paper border border-cream rounded-xl font-body text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs uppercase tracking-widest text-muted">
                Código da sala
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: A3X9F2"
                maxLength={6}
                className="w-full px-4 py-3 bg-paper border border-cream rounded-xl font-body text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors font-mono text-lg tracking-widest"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-accent text-sm font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-white font-display font-700 uppercase tracking-widest rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Aguarde..." : tab === "create" ? "Criar Sala →" : "Entrar →"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-muted text-xs font-body">
        Compartilhe o código de 6 letras com seu time.
      </p>
    </main>
  );
}
