"use client";

import { useState } from "react";
import { DEFAULT_CARD_VALUES } from "@/lib/types";

interface Props {
  initial: string[];
  onSave: (values: string[]) => void;
  onClose: () => void;
}

export default function CardEditor({ initial, onSave, onClose }: Props) {
  const [raw, setRaw] = useState(initial.join(", "));
  const [error, setError] = useState("");

  function handleSave() {
    const values = raw
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (values.length < 2) {
      setError("Adicione pelo menos 2 valores.");
      return;
    }
    if (values.length > 20) {
      setError("Máximo de 20 valores.");
      return;
    }
    onSave(values);
  }

  function handlePreset(preset: string[]) {
    setRaw(preset.join(", "));
    setError("");
  }

  const presets = [
    { label: "Fibonacci", values: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"] },
    { label: "T-Shirt", values: ["XS", "S", "M", "L", "XL", "XXL", "?"] },
    { label: "1–10", values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "?"] },
    { label: "Powers of 2", values: ["1", "2", "4", "8", "16", "32", "64", "?", "☕"] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-700 text-xl text-ink">Editar Cards</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-widest text-muted mb-2">Presets</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.values)}
                className="px-3 py-1.5 text-xs font-display uppercase tracking-widest border border-cream rounded-lg hover:border-ink hover:text-ink text-muted transition-colors"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => handlePreset(DEFAULT_CARD_VALUES)}
              className="px-3 py-1.5 text-xs font-display uppercase tracking-widest border border-cream rounded-lg hover:border-ink hover:text-ink text-muted transition-colors"
            >
              Padrão
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="mb-2">
          <p className="font-display text-xs uppercase tracking-widest text-muted mb-2">
            Valores (separados por vírgula)
          </p>
          <textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(""); }}
            rows={3}
            className="w-full px-4 py-3 bg-paper border border-cream rounded-xl font-mono text-sm text-ink focus:outline-none focus:border-ink transition-colors resize-none"
          />
        </div>

        {/* Preview */}
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-widest text-muted mb-2">Preview</p>
          <div className="flex flex-wrap gap-2">
            {raw.split(/[,\n]/).map((v) => v.trim()).filter(Boolean).slice(0, 20).map((v, i) => (
              <div
                key={i}
                className="w-10 h-14 bg-paper border border-cream rounded-lg flex items-center justify-center font-display font-700 text-sm text-ink"
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-accent text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-cream text-muted font-display text-sm uppercase tracking-widest rounded-xl hover:border-ink hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-ink text-paper font-display text-sm uppercase tracking-widest rounded-xl hover:bg-opacity-80 transition-all"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
