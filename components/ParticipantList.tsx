"use client";

import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  revealed: boolean;
  myId: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const COLORS = [
  "bg-rose-200 text-rose-800",
  "bg-sky-200 text-sky-800",
  "bg-emerald-200 text-emerald-800",
  "bg-amber-200 text-amber-800",
  "bg-violet-200 text-violet-800",
  "bg-pink-200 text-pink-800",
  "bg-teal-200 text-teal-800",
];

export default function ParticipantList({ participants, revealed, myId }: Props) {
  return (
    <div>
      <p className="font-display text-xs uppercase tracking-widest text-muted mb-4">
        Participantes ({participants.length})
      </p>
      <div className="flex flex-col gap-2">
        {participants.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              p.id === myId ? "bg-paper" : "hover:bg-paper"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-700 text-xs shrink-0 ${COLORS[i % COLORS.length]}`}
            >
              {getInitials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-ink truncate">
                {p.name}
                {p.id === myId && (
                  <span className="ml-1 text-muted text-xs">(você)</span>
                )}
              </p>
            </div>
            <div className="shrink-0">
              {revealed ? (
                <span
                  className={`font-mono font-500 text-sm px-2 py-0.5 rounded-lg ${
                    p.vote
                      ? "bg-ink text-paper"
                      : "bg-cream text-muted"
                  }`}
                >
                  {p.vote ?? "—"}
                </span>
              ) : (
                <div
                  className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center ${
                    p.vote
                      ? "bg-ink border-ink"
                      : "bg-cream border-cream animate-pulse-soft"
                  }`}
                >
                  {p.vote ? (
                    <span className="text-paper text-xs">✓</span>
                  ) : (
                    <span className="text-muted text-xs">?</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {participants.length === 0 && (
          <p className="text-muted text-sm font-body italic">Nenhum participante ainda.</p>
        )}
      </div>
    </div>
  );
}
