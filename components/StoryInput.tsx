"use client";

import { useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function StoryInput({ value, onChange }: Props) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setLocal(value);
  }, [value, editing]);

  function handleBlur() {
    setEditing(false);
    if (local !== value) onChange(local);
  }

  return (
    <div className="mb-6">
      <p className="font-display text-xs uppercase tracking-widest text-muted mb-2">
        História / Tarefa
      </p>
      <textarea
        value={local}
        onChange={(e) => { setLocal(e.target.value); setEditing(true); }}
        onBlur={handleBlur}
        placeholder="Descreva a história ou tarefa a ser estimada..."
        rows={2}
        className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors resize-none text-sm"
      />
    </div>
  );
}
