"use client";

import CardEditor from "@/components/CardEditor";
import ParticipantList from "@/components/ParticipantList";
import ResultsPanel from "@/components/ResultsPanel";
import StoryInput from "@/components/StoryInput";
import VotingCard from "@/components/VotingCard";
import { Room } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 2500;
const JOIN_RETRY_ATTEMPTS = 4;
const JOIN_RETRY_DELAY_MS = 300;

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState("");
  const [myName, setMyName] = useState("");
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCardEditor, setShowCardEditor] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myIdRef = useRef("");
  const myNameRef = useRef("");
  const notFoundStreakRef = useRef(0);

  async function wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/room?id=${id}`);
      if (res.status === 404) {
        notFoundStreakRef.current += 1;
        if (notFoundStreakRef.current < 3) return;
        // Evita falso-positivo em 404 transitório; só marca not found após sequência de falhas
        if (pollRef.current) clearInterval(pollRef.current);
        setNotFound(true);
        return;
      }
      if (!res.ok) return;
      notFoundStreakRef.current = 0;
      const data: Room = await res.json();
      setRoom(data);
      const me = data.participants.find((p) => p.id === myIdRef.current);
      if (me) setMyVote(me.vote);
    } catch { /* ignore network errors temporários */ }
  }, [id]);

  async function doJoin(pid: string, pname: string) {
    setLoading(true);
    setNotFound(false);
    for (let attempt = 1; attempt <= JOIN_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id, participantId: pid, participantName: pname }),
        });

        if (response.ok) {
          const data: Room = await response.json();
          setRoom(data);
          setMyId(pid);
          setLoading(false);
          return;
        }

        if (response.status !== 404 || attempt === JOIN_RETRY_ATTEMPTS) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        await wait(JOIN_RETRY_DELAY_MS * attempt);
      } catch {
        if (attempt === JOIN_RETRY_ATTEMPTS) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        await wait(JOIN_RETRY_DELAY_MS * attempt);
      }
    }
  }

  // Init: prepara IDs e decide se pede nome ou entra direto
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const pid = sessionStorage.getItem("participantId") || crypto.randomUUID();
    sessionStorage.setItem("participantId", pid);
    myIdRef.current = pid;

    const savedName = sessionStorage.getItem("participantName");
    if (!savedName) {
      // Primeiro acesso via link direto — pede nome antes de entrar
      setLoading(false);
      setShowNameModal(true);
      return;
    }

    myNameRef.current = savedName;
    setMyName(savedName);
    void doJoin(pid, savedName);
  }, [id]);

  // Polling
  useEffect(() => {
    if (!myId) return;
    pollRef.current = setInterval(fetchRoom, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchRoom, myId]);

  // Leave on unmount
  useEffect(() => {
    const handleUnload = () => {
      if (myIdRef.current) {
        fetch("/api/vote", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id, participantId: myIdRef.current }),
          keepalive: true,
        }).catch(() => { });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [id]);

  async function handleVote(value: string) {
    const newVote = myVote === value ? null : value;
    setMyVote(newVote);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, participantId: myId, participantName: myName, vote: newVote }),
      });
      const data: Room = await res.json();
      setRoom(data);
    } catch { /* ignore */ }
  }

  async function handleReveal() {
    const res = await fetch("/api/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, revealed: true }),
    });
    setRoom(await res.json());
  }

  async function handleReset() {
    setMyVote(null);
    const res = await fetch("/api/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reset: true }),
    });
    setRoom(await res.json());
  }

  async function handleStoryChange(story: string) {
    const res = await fetch("/api/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, currentStory: story }),
    });
    setRoom(await res.json());
  }

  async function handleSaveCards(values: string[]) {
    const res = await fetch("/api/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, cardValues: values }),
    });
    setRoom(await res.json());
    setShowCardEditor(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(id).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim() || "Anônimo";
    sessionStorage.setItem("participantName", name);
    myNameRef.current = name;
    setMyName(name);
    setShowNameModal(false);
    void doJoin(myIdRef.current, name);
  }

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-cream rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center shrink-0">
              <span className="text-paper font-display font-bold text-sm">SP</span>
            </div>
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-muted">Scrum Poker</p>
              <p className="font-display font-700 text-ink text-base leading-tight">Entrar na sala</p>
            </div>
          </div>
          <p className="font-body text-muted text-sm mb-5">Como você quer ser identificado pelos outros participantes?</p>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Seu nome"
              maxLength={32}
              className="w-full px-4 py-3 border border-cream rounded-xl font-body text-ink bg-paper placeholder:text-muted focus:outline-none focus:border-ink transition-colors"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-ink text-paper font-display uppercase tracking-widest text-sm rounded-xl hover:opacity-80 transition-opacity"
            >
              Entrar →
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cream border-t-ink rounded-full animate-spin" />
          <p className="font-display text-muted text-sm uppercase tracking-widest">Entrando na sala...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-display font-700 text-2xl text-ink mb-2">Sala não encontrada</p>
          <p className="font-body text-muted mb-6">O código pode estar errado ou a sala expirou.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-ink text-paper font-display uppercase tracking-widest rounded-xl"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const allVoted = room.participants.length > 0 && room.participants.every((p) => p.vote !== null);
  const votedCount = room.participants.filter((p) => p.vote !== null).length;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top bar */}
      <header className="border-b border-cream bg-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="text-paper font-display font-bold text-sm">SP</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-700 text-ink text-base leading-tight truncate">{room.name}</h1>
            <div className="flex items-center gap-2">
              <button onClick={copyCode} className="flex items-center gap-1 group">
                <span className="font-mono text-xs text-muted tracking-widest">{id}</span>
              </button>
              <button
                onClick={copyLink}
                className="text-xs text-muted hover:text-accent transition-colors font-body"
              >
                {copied ? "✓ copiado!" : "· copiar link"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Vote progress pill */}
          {!room.revealed && room.participants.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-paper rounded-full text-xs font-mono text-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${allVoted ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
              {votedCount}/{room.participants.length}
            </span>
          )}

          <button
            onClick={() => setShowCardEditor(true)}
            className="px-3 py-2 text-xs font-display uppercase tracking-widest text-muted hover:text-ink border border-cream rounded-lg hover:border-ink transition-colors"
          >
            Cards
          </button>

          {!room.revealed ? (
            <button
              onClick={handleReveal}
              disabled={room.participants.length === 0}
              className={`px-4 py-2 text-xs font-display uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 ${allVoted
                ? "bg-accent text-white hover:opacity-90 shadow-md"
                : "bg-ink text-paper hover:opacity-80"
                }`}
            >
              Revelar →
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-ink text-paper text-xs font-display uppercase tracking-widest rounded-lg hover:opacity-80 transition-all"
            >
              Nova Rodada ↺
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <StoryInput value={room.currentStory} onChange={handleStoryChange} />

          {/* Results */}
          {room.revealed && (
            <div className="mb-6 animate-slide-up">
              <ResultsPanel room={room} />
            </div>
          )}

          {/* Voting cards */}
          {!room.revealed ? (
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-muted mb-4">
                Sua estimativa
                {myVote && (
                  <span className="ml-2 normal-case tracking-normal font-body text-ink">
                    — selecionado: <strong>{myVote}</strong>
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                {room.cardValues.map((value) => (
                  <VotingCard
                    key={value}
                    value={value}
                    selected={myVote === value}
                    onClick={() => handleVote(value)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="font-display text-xs uppercase tracking-widest text-muted mb-4">
                Votos individuais
              </p>
              <div className="flex flex-wrap gap-3">
                {room.participants.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-16 h-24 rounded-xl border-2 flex items-center justify-center font-display font-700 text-2xl animate-flip-in ${p.vote ? "bg-ink text-paper border-ink" : "bg-cream text-muted border-cream"
                        }`}
                    >
                      {p.vote ?? "—"}
                    </div>
                    <span className="text-xs font-body text-muted text-center max-w-[64px] truncate">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-64 md:w-72 border-l border-cream bg-white p-4 overflow-y-auto hidden sm:block">
          <ParticipantList
            participants={room.participants}
            revealed={room.revealed}
            myId={myId}
          />
        </aside>
      </div>

      {/* Mobile participant count bar */}
      <div className="sm:hidden border-t border-cream bg-white px-4 py-2 flex items-center justify-between">
        <span className="font-body text-xs text-muted">
          {room.participants.length} participante{room.participants.length !== 1 ? "s" : ""}
        </span>
        {!room.revealed && (
          <span className="font-mono text-xs text-muted">
            {votedCount}/{room.participants.length} votaram
          </span>
        )}
      </div>

      {/* Card editor modal */}
      {showCardEditor && (
        <CardEditor
          initial={room.cardValues}
          onSave={handleSaveCards}
          onClose={() => setShowCardEditor(false)}
        />
      )}
    </div>
  );
}
