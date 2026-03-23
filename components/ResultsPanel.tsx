"use client";

import { Room, calcStats } from "@/lib/types";

interface Props {
  room: Room;
}

export default function ResultsPanel({ room }: Props) {
  const votes = room.participants
    .map((p) => p.vote)
    .filter((v): v is string => v !== null);

  const { average, min, max, consensus } = calcStats(votes);

  // Vote distribution
  const distribution: Record<string, number> = {};
  for (const v of votes) {
    distribution[v] = (distribution[v] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="bg-white border border-cream rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display font-700 text-lg text-ink">Resultado</h2>
        {consensus && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-display uppercase tracking-widest rounded-full">
            Consenso! 🎉
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Média", value: average !== null ? String(average) : "—" },
          { label: "Menor", value: min ?? "—" },
          { label: "Maior", value: max ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-paper rounded-xl p-4 text-center">
            <p className="font-display text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className="font-display font-800 text-3xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Distribution */}
      {Object.keys(distribution).length > 0 && (
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-muted mb-3">Distribuição</p>
          <div className="flex items-end gap-2 h-20">
            {room.cardValues
              .filter((v) => distribution[v])
              .map((v) => {
                const count = distribution[v] || 0;
                const height = (count / maxCount) * 100;
                return (
                  <div key={v} className="flex flex-col items-center gap-1 flex-1">
                    <span className="font-display font-600 text-xs text-muted">{count}</span>
                    <div
                      className="w-full bg-ink rounded-t-md transition-all"
                      style={{ height: `${height}%`, minHeight: count > 0 ? "8px" : "0" }}
                    />
                    <span className="font-mono text-xs text-ink">{v}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {votes.length === 0 && (
        <p className="text-muted font-body text-sm italic">Nenhum voto registrado.</p>
      )}
    </div>
  );
}
