import Link from "next/link";
import type { EmergencyCase, CaseLearningRecord } from "@/types/emergency";

type Props = {
  caseData: EmergencyCase;
  record: CaseLearningRecord;
};

const difficultyColor: Record<string, string> = {
  初級: "bg-green-900 text-green-300 border-green-700",
  中級: "bg-blue-900 text-blue-300 border-blue-700",
  実戦: "bg-orange-900 text-orange-300 border-orange-700",
  地雷: "bg-red-900 text-red-300 border-red-700",
};

const ratingBorderColor: Record<string, string> = {
  A: "border-green-600",
  B: "border-yellow-600",
  C: "border-red-500",
};

const ratingBadge: Record<string, string> = {
  A: "bg-green-800 text-green-100",
  B: "bg-yellow-800 text-yellow-100",
  C: "bg-red-800 text-red-100",
};

export default function CaseCard({ caseData, record }: Props) {
  const isC = record.rating === "C";
  const playedAt = new Date(record.review.playedAt).toLocaleDateString("ja-JP");

  return (
    <Link href={`/case/${caseData.id}`}>
      <div
        className={`rounded-xl border-2 p-4 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer ${
          ratingBorderColor[record.rating]
        } ${isC ? "shadow-lg shadow-red-900/40" : ""}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                difficultyColor[caseData.difficulty] ??
                "bg-slate-700 text-slate-300"
              }`}
            >
              {caseData.difficulty}
            </span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {caseData.chiefComplaint}
            </span>
          </div>
          <span
            className={`rounded-full px-3 py-0.5 text-sm font-bold ${
              ratingBadge[record.rating]
            }`}
          >
            {record.rating}
          </span>
        </div>

        <h3 className="font-semibold text-slate-100 mb-1">{caseData.title}</h3>
        <p className="text-xs text-slate-400 mb-3">{caseData.finalDiagnosis}</p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>最終学習: {playedAt}</span>
          <span>回数: {record.review.reviewCount}回</span>
        </div>

        {isC && (
          <div className="mt-2 rounded bg-red-950/50 border border-red-800 px-2 py-1 text-xs text-red-400">
            要復習 — もう一度取り組みましょう
          </div>
        )}
      </div>
    </Link>
  );
}
