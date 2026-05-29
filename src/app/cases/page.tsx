"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { emergencyCases } from "@/data/emergencyCases";
import { getAIGeneratedCases } from "@/lib/emergencyStorage";
import type { ChiefComplaint, EmergencyCase } from "@/types/emergency";

const complaintEmoji: Record<string, string> = {
  胸痛: "❤️", 腹痛: "🦵", 発熱: "🌡️", 呼吸困難: "🫁", 意識障害: "🧠",
  頭痛: "😵", めまい: "🌀", 動悸: "💓", 失神: "😵‍💫", 耳鼻科救急: "🟡",
  腰背部痛: "🔴", "麻痺・しびれ": "🧠", 浮腫: "💧", "嘔吐・下痢": "🤢",
  痙攣: "⚡", 皮疹: "🔴", 精神科的主訴: "💬", その他: "❓",
};

const difficultyBadgeColor: Record<string, string> = {
  初級: "border-green-700 text-green-400",
  中級: "border-blue-700 text-blue-400",
  実戦: "border-orange-700 text-orange-400",
  地雷: "border-red-700 text-red-400",
};

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chief = searchParams.get("chief") as ChiefComplaint | null;
  const [aiCases, setAiCases] = useState<EmergencyCase[]>([]);

  useEffect(() => {
    getAIGeneratedCases().then(setAiCases).catch(console.error);
  }, []);

  const presetCases = chief
    ? emergencyCases.filter((c) => c.chiefComplaint === chief)
    : emergencyCases;

  const filteredAiCases = chief
    ? aiCases.filter((c) => c.chiefComplaint === chief)
    : aiCases;

  const totalCount = presetCases.length + filteredAiCases.length;

  function startRandom() {
    const pool = [...presetCases, ...filteredAiCases];
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/case/${pick.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 flex-shrink-0">
            ← 戻る
          </Link>
          <h1 className="text-base font-bold text-slate-100 truncate">
            {chief
              ? `${complaintEmoji[chief] ?? "📋"} ${chief}の症例一覧`
              : "全症例一覧"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <button
          onClick={startRandom}
          disabled={totalCount === 0}
          className="w-full rounded-2xl bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 transition-colors px-6 py-4 text-base font-bold text-white shadow-lg shadow-red-900/30"
        >
          {chief ? `「${chief}」からランダムで始める` : "ランダムで始める"}
        </button>

        {presetCases.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              📚 プリセット症例（{presetCases.length}件）
            </h2>
            <div className="space-y-2">
              {presetCases.map((c) => (
                <Link key={c.id} href={`/case/${c.id}`}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all px-4 py-3">
                    <span className="text-xl">{complaintEmoji[c.chiefComplaint] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-200 truncate">{c.title}</span>
                        <span className="text-xs rounded-full px-1.5 py-0.5 bg-slate-700/50 border border-slate-600 text-slate-400 flex-shrink-0">
                          📚
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{c.finalDiagnosis}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`rounded-full text-xs px-2 py-0.5 border ${difficultyBadgeColor[c.difficulty] ?? "border-slate-700 text-slate-400"}`}
                      >
                        {c.difficulty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredAiCases.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              🤖 AI生成症例（{filteredAiCases.length}件）
            </h2>
            <div className="space-y-2">
              {filteredAiCases.map((c) => (
                <Link key={c.id} href={`/case/${c.id}`}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all px-4 py-3">
                    <span className="text-xl">{complaintEmoji[c.chiefComplaint] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-200 truncate">{c.title}</span>
                        <span className="text-xs rounded-full px-1.5 py-0.5 bg-purple-900/50 border border-purple-700 text-purple-300 flex-shrink-0">
                          🤖 AI
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{c.finalDiagnosis}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`rounded-full text-xs px-2 py-0.5 border ${difficultyBadgeColor[c.difficulty] ?? "border-slate-700 text-slate-400"}`}
                      >
                        {c.difficulty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">該当する症例がありません</p>
        )}
      </main>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">読み込み中...</span>
        </div>
      }
    >
      <CasesContent />
    </Suspense>
  );
}
