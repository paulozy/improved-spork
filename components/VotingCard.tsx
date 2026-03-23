"use client";

interface Props {
  value: string;
  selected: boolean;
  onClick: () => void;
}

export default function VotingCard({ value, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        w-16 h-24 rounded-xl font-display font-700 text-xl
        border-2 transition-all duration-150 select-none
        hover:scale-105 active:scale-95
        ${selected
          ? "bg-ink text-paper border-ink shadow-lg scale-105 -translate-y-1"
          : "bg-white text-ink border-cream hover:border-ink hover:shadow-md"
        }
      `}
    >
      {value}
    </button>
  );
}
