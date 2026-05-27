"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllRecords } from "@/lib/emergencyStorage";
import { emergencyCases } from "@/data/emergencyCases";
import type { CaseLearningRecord, ChiefComplaint } from "@/types/emergency";

type ComplaintStat = {
  complaint: ChiefComplaint;
  total: number;
  a: number;
  b: number;
  c: number;
  cRate: number;
};

export default function StatsPage() {
  const [records, setRecords] = useState<CaseLearningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllRecords()
      .then(setRecords)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const total = records.length;
  const aCount = records.filter((r) => r.rating === "A").length;
  const bCount = records.filter((r) => r.rating === "B").length;
  const cCount = records.filter((r) => r.rating === "C").length;

  const aRate = total ? Math.round((aCount / total) * 100) : 0;
  const bRate = total ? Math.round((bCount / total) * 100) : 0;
  const cRate = total ? Math.round((cCount / total) * 100) : 0;

  const cRecords = records.filter((r) => r.rating === "C");

  const complaintMap: Record<string, { total: number; a: number; b: number; c: number }> = {};
  for (const record of records) {
    const caseData = emergencyCases.find((c) => c.id === record.caseId);
    if (!caseData) continue;
    const key = caseData.chiefComplaint;
    if (!complaintMap[key]) complaintMap[key] = { total: 0, a: 0, b: 0, c: 0 };
    complaintMap[key].total++;
    if (record.rating === "A") complaintMap[key].a++;
    else if (record.rating === "B") complaintMap[key].b++;
    else complaintMap[key].c++;
  }

  const complaintStats: ComplaintStat[] = Object.entries(complaintMap)
    .map(([complaint, v]) => ({
      complaint: complaint as ChiefComplaint,
      ...v,
      cRate: v.total ? Math.round((v.c / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.cRate - a.cRate);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
              ← ホーム
            </Link>
            <h1 className="text-lg font-bold text-slate-100">学習統計</h1>
          </div>
          <Link href="/review" className="text-xs text-slate-400 hover:text-slate-200">
            復習 →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <EmptyStats />
        ) : (
          <>
            {/* Total */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                <div className="text-3xl font-bold text-slate-100">{total}</div>
                <div className="text-xs text-slate-400 mt-1">総学習症例</div>
              </div>
              <div className="rounded-xl border border-green-700 bg-green-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{aCount}</div>
                <div className="text-xs text-slate-400 mt-1">A: できた</div>
              </div>
              <div className="rounded-xl border border-yellow-700 bg-yellow-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{bCount}</div>
                <div className="text-xs text-slate-400 mt-1">B: まあまあ</div>
              </div>
              <div className="rounded-xl border border-red-700 bg-red-950/30 p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{cCount}</div>
                <div className="text-xs text-slate-400 mt-1">C: 要復習</div>
              </div>
            </div>

            {/* Distribution bar */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                A/B/C 分布
              </h2>
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
                  {aRate > 0 && (
                    <div className="bg-green-600 transition-all" style={{ width: `${aRate}%` }} title={`A: ${aRate}%`} />
                  )}
                  {bRate > 0 && (
                    <div className="bg-yellow-600 transition-all" style={{ width: `${bRate}%` }} title={`B: ${bRate}%`} />
                  )}
                  {cRate > 0 && (
                    <div className="bg-red-600 transition-all" style={{ width: `${cRate}%` }} title={`C: ${cRate}%`} />
                  )}
                  {total === 0 && <div className="bg-slate-700 w-full" />}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span className="text-green-400">A {aRate}%</span>
                  <span className="text-yellow-400">B {bRate}%</span>
                  <span className="text-red-400">C {cRate}%</span>
                </div>
              </div>
            </div>

            {/* Weakness ranking */}
            {complaintStats.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  主訴別弱点ランキング（C率順）
                </h2>
                <div className="space-y-3">
                  {complaintStats.map((cs, rank) => (
                    <div key={cs.complaint} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${rank === 0 ? "text-red-400" : "text-slate-400"}`}>
                            #{rank + 1}
                          </span>
                          <span className="font-semibold text-slate-200">{cs.complaint}</span>
                          <span className="text-xs text-slate-500">({cs.total}件)</span>
                        </div>
                        <span className={`text-sm font-bold ${cs.cRate >= 50 ? "text-red-400" : cs.cRate >= 30 ? "text-yellow-400" : "text-green-400"}`}>
                          C率 {cs.cRate}%
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {cs.a > 0 && <div className="bg-green-600" style={{ width: `${Math.round((cs.a / cs.total) * 100)}%` }} />}
                        {cs.b > 0 && <div className="bg-yellow-600" style={{ width: `${Math.round((cs.b / cs.total) * 100)}%` }} />}
                        {cs.c > 0 && <div className="bg-red-600" style={{ width: `${Math.round((cs.c / cs.total) * 100)}%` }} />}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span className="text-green-500">A:{cs.a}</span>
                        <span className="text-yellow-500">B:{cs.b}</span>
                        <span className="text-red-500">C:{cs.c}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C cases list */}
            {cRecords.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
                  要復習症例（C評価）
                </h2>
                <div className="space-y-2">
                  {cRecords.map((r) => {
                    const caseData = emergencyCases.find((c) => c.id === r.caseId);
                    if (!caseData) return null;
                    return (
                      <Link key={r.id} href={`/case/${caseData.id}`}>
                        <div className="flex items-center gap-3 rounded-xl border-2 border-red-700 bg-red-950/20 hover:bg-red-950/40 transition-all px-4 py-3 cursor-pointer">
                          <span className="text-red-400 font-bold text-lg">C</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-200 truncate">{caseData.title}</div>
                            <div className="text-xs text-slate-500 truncate">{caseData.finalDiagnosis}</div>
                          </div>
                          <div className="text-xs text-slate-500 flex-shrink-0">{caseData.chiefComplaint}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coverage */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                症例カバー率
              </h2>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-3 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${Math.round((total / emergencyCases.length) * 100)}%` }}
                  />
                </div>
                <span className="text-sm text-slate-300 font-semibold">
                  {total}/{emergencyCases.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                全{emergencyCases.length}症例中{total}症例を学習済み
              </p>
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

function EmptyStats() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="text-5xl">📊</div>
      <h2 className="text-lg font-semibold text-slate-200">まだデータがありません</h2>
      <p className="text-slate-400 text-sm">
        症例を学習して自己評価を行うと、統計が表示されます
      </p>
      <Link
        href="/"
        className="inline-block rounded-xl bg-red-600 hover:bg-red-500 px-6 py-2.5 text-sm font-semibold text-white"
      >
        症例を始める
      </Link>
    </div>
  );
}
