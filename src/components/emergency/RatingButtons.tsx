"use client";

import type { SelfRating } from "@/types/emergency";

type Props = {
  selected: SelfRating | null;
  onSelect: (rating: SelfRating) => void;
};

const ratings: {
  value: SelfRating;
  label: string;
  description: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "A",
    label: "A：できた",
    description: "今後も対応できそう",
    color: "border-green-700 text-green-400 hover:bg-green-900/30",
    activeColor: "border-green-500 bg-green-900/60 text-green-300",
  },
  {
    value: "B",
    label: "B：まあまあ",
    description: "もう少し復習が必要",
    color: "border-yellow-700 text-yellow-400 hover:bg-yellow-900/30",
    activeColor: "border-yellow-500 bg-yellow-900/60 text-yellow-300",
  },
  {
    value: "C",
    label: "C：要復習",
    description: "理解が不十分、要再学習",
    color: "border-red-700 text-red-400 hover:bg-red-900/30",
    activeColor: "border-red-500 bg-red-900/60 text-red-300",
  },
];

export default function RatingButtons({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ratings.map((r) => (
        <button
          key={r.value}
          onClick={() => onSelect(r.value)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            selected === r.value ? r.activeColor : r.color
          }`}
        >
          <div className="text-lg font-bold">{r.label}</div>
          <div className="text-sm mt-1 opacity-80">{r.description}</div>
        </button>
      ))}
    </div>
  );
}
