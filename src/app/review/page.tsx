"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllRecords } from "@/lib/emergencyStorage";
import { emergencyCases } from "@/data/emergencyCases";
import CaseCard from "@/components/emergency/CaseCard";
import FilterBar from "@/components/emergency/FilterBar";
import type { CaseLearningRecord, SelfRating, ChiefComplaint } from "@/types/emergency";

export default function ReviewPage() {
  const [records, setRecords] = useState<CaseLearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<SelfRating | "all">("all");
  const [complaintFilter, setComplaintFilter] = useState<ChiefComplaint | "all">("all");

  useEffect(() => {
    getAllRecords()
      .then(setRecords)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecords = records.filter((r) => {
    const caseData = emergencyCases.find((c) => c.id === r.caseId);
    if (!caseData) return false;
    if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
    if (complaintFilter !== "all" && caseData.chiefComplaint !== complaintFilter) return false;
    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const order = { C: 0, B: 1, A: 2 };
    return order[a.rating] - order[b.rating];
  });

  const cCount = records.filter((r) => r.rating === "C").length;

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
              ← ホーム
            </Link>
            <h1 className="text-lg font-bold text-slate-100">復習ページ</h1>
          </div>
          <Link href="/stats" className="text-xs text-slate-400 hover:text-slate-200">
            統計 →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <StatBadge label="学習済み" value={records.length} color="text-slate-200" />
              <StatBadge label="要復習 C" value={cCount} color="text-red-400" />
              <StatBadge label="表示中" value={sortedRecords.length} color="text-blue-400" />
            </div>

            {/* Filter */}
            <FilterBar
              ratingFilter={ratingFilter}
              onRatingChange={setRatingFilter}
              complaintFilter={complaintFilter}
              onComplaintChange={setComplaintFilter}
            />

            {/* Cases */}
            {records.length === 0 ? (
              <EmptyState />
            ) : sortedRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg mb-2">条件に一致する症例がありません</p>
                <button
                  onClick={() => {
                    setRatingFilter("all");
                    setComplaintFilter("all");
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  フィルターをリセット
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cCount > 0 && ratingFilter === "all" && (
                  <div className="rounded-xl border border-red-700 bg-red-950/30 px-4 py-3 flex items-center gap-2">
                    <span className="text-red-400 font-bold">⚠</span>
                    <p className="text-sm text-red-300">
                      要復習（C）が<span className="font-bold">{cCount}件</span>あります。先に取り組みましょう。
                    </p>
                  </div>
                )}
                {sortedRecords.map((record) => {
                  const caseData = emergencyCases.find((c) => c.id === record.caseId);
                  if (!caseData) return null;
                  return (
                    <CaseCard key={record.id} caseData={caseData} record={record} />
                  );
                })}
              </div>
            )}

            {/* Start new */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
              <p className="text-sm text-slate-400 mb-3">新しい症例を始めますか？</p>
              <Link
                href="/"
                className="inline-block rounded-xl bg-red-600 hover:bg-red-500 px-6 py-2.5 text-sm font-semibold text-white"
              >
                ホームへ戻る
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2 py-16">
      <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
      <span className="text-slate-400 text-sm">読み込み中...</span>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="text-5xl">📚</div>
      <h2 className="text-lg font-semibold text-slate-200">まだ学習履歴がありません</h2>
      <p className="text-slate-400 text-sm">
        症例を完了して自己評価（A/B/C）を選択すると、ここに保存されます
      </p>
      <Link
        href="/"
        className="inline-block rounded-xl bg-red-600 hover:bg-red-500 px-6 py-2.5 text-sm font-semibold text-white"
      >
        最初の症例を始める
      </Link>
    </div>
  );
}
