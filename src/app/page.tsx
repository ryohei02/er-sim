"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emergencyCases } from "@/data/emergencyCases";
import { generateCaseWithAI } from "@/lib/ai/generateCase";
import { saveAIGeneratedCase, getAIGeneratedCases, deleteAIGeneratedCase } from "@/lib/emergencyStorage";
import { downloadCaseAsText } from "@/lib/downloadCase";
import type { ChiefComplaint, Difficulty, EmergencyCase } from "@/types/emergency";

const complaints: ChiefComplaint[] = [
  "胸痛", "腹痛", "発熱", "呼吸困難", "意識障害",
  "頭痛", "めまい", "動悸", "失神", "耳鼻科救急",
  "腰背部痛", "麻痺・しびれ", "浮腫", "嘔吐・下痢",
  "痙攣", "皮疹", "精神科的主訴", "その他",
  "CPA", "骨折・外傷",
  "泌尿器", "咳・喀血", "外傷・頭部打撲", "薬物中毒・過量服薬",
];

const difficulties: Difficulty[] = ["初級", "中級", "実戦", "地雷"];

const complaintEmoji: Record<string, string> = {
  胸痛: "❤️", 腹痛: "🦵", 発熱: "🌡️", 呼吸困難: "🫁", 意識障害: "🧠",
  頭痛: "😵", めまい: "🌀", 動悸: "💓", 失神: "😵‍💫", 耳鼻科救急: "🟡",
  腰背部痛: "🔴", "麻痺・しびれ": "🧠", 浮腫: "💧", "嘔吐・下痢": "🤢",
  痙攣: "⚡", 皮疹: "🔴", 精神科的主訴: "💬", その他: "❓",
  CPA: "🫀", "骨折・外傷": "🦴",
  泌尿器: "🫘", "咳・喀血": "🩸", "外傷・頭部打撲": "🪖", "薬物中毒・過量服薬": "💊",
};


export default function TopPage() {
  const router = useRouter();
  const [aiComplaint, setAiComplaint] = useState<ChiefComplaint>("胸痛");
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("中級");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCases, setAiCases] = useState<EmergencyCase[]>([]);
  const [newlyGeneratedCase, setNewlyGeneratedCase] = useState<EmergencyCase | null>(null);

  useEffect(() => {
    getAIGeneratedCases()
      .then(setAiCases)
      .catch((e) => console.error(e));
  }, []);

  async function handleGenerateAI() {
    setAiLoading(true);
    setAiError(null);
    setNewlyGeneratedCase(null);
    try {
      const c = await generateCaseWithAI(aiComplaint, aiDifficulty);
      console.log("[handleGenerateAI] generated:", c.id, "chiefComplaint:", c.chiefComplaint);
      // saveAIGeneratedCase throws on failure — error surfaces in UI
      await saveAIGeneratedCase(c);
      const updated = await getAIGeneratedCases();
      setAiCases(updated);
      // Use the saved-and-retrieved case so chiefComplaint matches what's in DB
      const saved = updated.find((x) => x.id === c.id) ?? c;
      console.log("[handleGenerateAI] using saved case chiefComplaint:", saved.chiefComplaint);
      setNewlyGeneratedCase(saved);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDeleteAICase(id: string) {
    await deleteAIGeneratedCase(id);
    if (newlyGeneratedCase?.id === id) setNewlyGeneratedCase(null);
    setAiCases(await getAIGeneratedCases());
  }

  function startRandom() {
    const pool = [...emergencyCases, ...aiCases];
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/case/${pick.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">救急当直シミュレーター</h1>
            <p className="text-xs text-slate-400">ER Simulation Training</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link href="/review" className="text-slate-300 hover:text-white transition-colors">
              復習
            </Link>
            <Link href="/stats" className="text-slate-300 hover:text-white transition-colors">
              統計
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🏥</div>
          <h2 className="text-3xl font-bold text-slate-100">今夜の当直、大丈夫ですか？</h2>
          <p className="text-slate-400 text-lg">
            救急当直で遭遇する重症疾患を実戦形式でトレーニング
          </p>
          <p className="text-slate-500 text-sm">
            全{emergencyCases.length}症例 + AI生成{aiCases.length}症例 — バイタル・検査・治療まで本格シミュレーション
          </p>
        </div>

        {/* Random start */}
        <button
          onClick={startRandom}
          className="w-full rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors px-6 py-5 text-xl font-bold text-white shadow-lg shadow-red-900/40"
        >
          ランダム症例を開始
        </button>

        {/* Chief complaint vertical list */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            主訴から選ぶ
          </h3>
          <div className="rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-700/60">
            {complaints.map((complaint) => {
              const count = emergencyCases.filter((c) => c.chiefComplaint === complaint).length;
              const aiCount = aiCases.filter((c) => c.chiefComplaint === complaint).length;
              return (
                <Link
                  key={complaint}
                  href={`/cases?chief=${encodeURIComponent(complaint)}`}
                  className="flex items-center px-4 py-4 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <span className="text-xl mr-3">{complaintEmoji[complaint] ?? "📋"}</span>
                  <span className="flex-1 text-sm font-medium text-slate-200">{complaint}</span>
                  <span className="text-xs text-slate-400 mr-3">
                    プリセット{count}件{aiCount > 0 ? ` + AI${aiCount}件` : ""}
                  </span>
                  <span className="text-slate-500 text-sm">›</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI case generation */}
        <div className="rounded-2xl border border-purple-700 bg-purple-950/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">✨</span>
            <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
              AI症例生成（Claude API）
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            主訴と難易度を選んでClaudeにオリジナル症例を生成させます。ANTHROPIC_API_KEYが必要です。
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">主訴</label>
              <select
                value={aiComplaint}
                onChange={(e) => setAiComplaint(e.target.value as ChiefComplaint)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {complaints.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">難易度</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="w-full rounded-xl bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 transition-colors px-4 py-3 text-sm font-semibold text-white"
          >
            {aiLoading ? "生成中..." : "AI症例を生成する"}
          </button>
          {aiError && (
            <p className="text-xs text-red-400 rounded-lg bg-red-950/30 border border-red-800 px-3 py-2">
              {aiError}
            </p>
          )}

          {/* Newly generated case actions */}
          {newlyGeneratedCase && (
            <div className="rounded-xl border border-purple-600 bg-purple-900/20 p-4 space-y-3">
              <div>
                <div className="text-xs text-purple-400 font-semibold mb-1">生成完了</div>
                <div className="text-sm font-medium text-slate-200">{newlyGeneratedCase.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{newlyGeneratedCase.finalDiagnosis}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/case/${newlyGeneratedCase.id}`)}
                  className="w-full rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
                >
                  <span>▶</span> この症例を始める
                </button>
                <button
                  onClick={() => downloadCaseAsText(newlyGeneratedCase)}
                  className="w-full rounded-lg border border-blue-600 bg-blue-950/40 hover:bg-blue-950/70 transition-colors px-4 py-2.5 text-sm font-semibold text-blue-300 flex items-center justify-center gap-2"
                >
                  <span>📄</span> テキストでダウンロード
                </button>
                <button
                  onClick={() => handleDeleteAICase(newlyGeneratedCase.id)}
                  className="w-full rounded-lg border border-red-700 bg-red-950/20 hover:bg-red-950/40 transition-colors px-4 py-2.5 text-sm font-semibold text-red-400 flex items-center justify-center gap-2"
                >
                  <span>🗑️</span> 削除する
                </button>
                <Link
                  href={`/cases?chief=${encodeURIComponent(newlyGeneratedCase.chiefComplaint)}`}
                  className="text-center text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 py-1"
                >
                  {newlyGeneratedCase.chiefComplaint}の主訴ページで確認する →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex gap-3">
          <Link
            href="/review"
            className="flex-1 text-center rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm text-slate-300 font-medium transition-all"
          >
            📚 復習ページ
          </Link>
          <Link
            href="/stats"
            className="flex-1 text-center rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm text-slate-300 font-medium transition-all"
          >
            📊 学習統計
          </Link>
        </div>
      </main>
    </div>
  );
}
