"use client";

import type { SelfRating, ChiefComplaint } from "@/types/emergency";

type Props = {
  ratingFilter: SelfRating | "all";
  onRatingChange: (v: SelfRating | "all") => void;
  complaintFilter: ChiefComplaint | "all";
  onComplaintChange: (v: ChiefComplaint | "all") => void;
};

const RATINGS: (SelfRating | "all")[] = ["all", "A", "B", "C"];
const RATING_LABEL: Record<string, string> = {
  all: "すべて",
  A: "A：できた",
  B: "B：まあまあ",
  C: "C：要復習",
};
const RATING_COLOR: Record<string, string> = {
  all: "border-slate-500 text-slate-300",
  A: "border-green-600 text-green-400",
  B: "border-yellow-600 text-yellow-400",
  C: "border-red-600 text-red-400",
};
const RATING_ACTIVE: Record<string, string> = {
  all: "bg-slate-600 text-white border-slate-400",
  A: "bg-green-800 text-green-100 border-green-500",
  B: "bg-yellow-800 text-yellow-100 border-yellow-500",
  C: "bg-red-800 text-red-100 border-red-500",
};

const COMPLAINTS: (ChiefComplaint | "all")[] = [
  "all",
  "胸痛",
  "腹痛",
  "発熱",
  "呼吸困難",
  "意識障害",
  "頭痛",
  "めまい",
  "動悸",
  "失神",
  "耳鼻科救急",
  "その他",
];

export default function FilterBar({
  ratingFilter,
  onRatingChange,
  complaintFilter,
  onComplaintChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">
          自己評価フィルター
        </div>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => onRatingChange(r)}
              className={`rounded-full border px-3 py-1 text-sm transition-all ${
                ratingFilter === r
                  ? RATING_ACTIVE[r]
                  : `${RATING_COLOR[r]} hover:opacity-80`
              }`}
            >
              {RATING_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">
          主訴フィルター
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPLAINTS.map((c) => (
            <button
              key={c}
              onClick={() => onComplaintChange(c)}
              className={`rounded-full border px-3 py-1 text-sm transition-all ${
                complaintFilter === c
                  ? "bg-blue-800 text-blue-100 border-blue-500"
                  : "border-slate-600 text-slate-300 hover:border-slate-400"
              }`}
            >
              {c === "all" ? "すべて" : c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
