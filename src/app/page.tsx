"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emergencyCases } from "@/data/emergencyCases";
import { generateCaseWithAI } from "@/lib/ai/generateCase";
import { saveAIGeneratedCase, getAIGeneratedCases, deleteAIGeneratedCase } from "@/lib/emergencyStorage";
import type { ChiefComplaint, Difficulty, EmergencyCase } from "@/types/emergency";

const complaints: ChiefComplaint[] = [
  "胸痛", "腹痛", "発熱", "呼吸困難", "意識障害",
  "頭痛", "めまい", "動悸", "失神", "耳鼻科救急",
  "腰背部痛", "麻痺・しびれ", "浮腫", "嘔吐・下痢",
  "痙攣", "皮疹", "精神科的主訴", "その他",
];

const difficulties: Difficulty[] = ["初級", "中級", "実戦", "地雷"];

const complaintEmoji: Record<string, string> = {
  胸痛: "❤️", 腹痛: "🫄", 発熱: "🌡️", 呼吸困難: "🫁", 意識障害: "🧠",
  頭痛: "💆", めまい: "🌀", 動悸: "💓", 失神: "😵", 耳鼻科救急: "👂",
  腰背部痛: "🦴", "麻痺・しびれ": "🫀", 浮腫: "💧", "嘔吐・下痢": "🤢",
  痙攣: "⚡", 皮疹: "🔴", 精神科的主訴: "💭", その他: "📋",
};

const difficultyColor: Record<string, string> = {
  初級: "border-green-500 text-green-400 hover:bg-green-900/30",
  中級: "border-blue-500 text-blue-400 hover:bg-blue-900/30",
  実戦: "border-orange-500 text-orange-400 hover:bg-orange-900/30",
  地雷: "border-red-500 text-red-400 hover:bg-red-900/30",
};

const difficultyActiveColor: Record<string, string> = {
  初級: "bg-green-800 border-green-400 text-green-100",
  中級: "bg-blue-800 border-blue-400 text-blue-100",
  実戦: "bg-orange-800 border-orange-400 text-orange-100",
  地雷: "bg-red-800 border-red-400 text-red-100",
};

const difficultyBadgeColor: Record<string, string> = {
  初級: "border-green-700 text-green-400",
  中級: "border-blue-700 text-blue-400",
  実戦: "border-orange-700 text-orange-400",
  地雷: "border-red-700 text-red-400",
};

export default function TopPage() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ChiefComplaint | null>(null);
  const [aiComplaint, setAiComplaint] = useState<ChiefComplaint>("胸痛");
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("中級");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCases, setAiCases] = useState<EmergencyCase[]>([]);

  useEffect(() => {
    getAIGeneratedCases()
      .then(setAiCases)
      .catch((e) => console.error(e));
  }, []);

  async function handleGenerateAI() {
    setAiLoading(true);
    setAiError(null);
    try {
      const c = await generateCaseWithAI(aiComplaint, aiDifficulty);
      console.log("[handleGenerateAI] generated case id:", c.id, "title:", c.title);
      await saveAIGeneratedCase(c);
      setAiCases(await getAIGeneratedCases());
      console.log("[handleGenerateAI] pushing to:", `/case/${c.id}`);
      router.push(`/case/${c.id}`);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDeleteAICase(id: string) {
    await deleteAIGeneratedCase(id);
    setAiCases(await getAIGeneratedCases());
  }

  function startRandom() {
    let pool = [...emergencyCases, ...aiCases];
    if (selectedDifficulty) {
      pool = pool.filter((c) => c.difficulty === selectedDifficulty);
    }
    if (selectedComplaint) {
      const filtered = pool.filter((c) => c.chiefComplaint === selectedComplaint);
      if (filtered.length > 0) pool = filtered;
    }
    if (pool.length === 0) pool = emergencyCases;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/case/${pick.id}`);
  }

  function startByComplaint(complaint: ChiefComplaint) {
    let pool = emergencyCases.filter((c) => c.chiefComplaint === complaint);
    if (selectedDifficulty) {
      const filtered = pool.filter((c) => c.difficulty === selectedDifficulty);
      if (filtered.length > 0) pool = filtered;
    }
    if (pool.length === 0) {
      alert(`「${complaint}」の症例が見つかりません`);
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/case/${pick.id}`);
  }

  // merged and sorted case list: presets first, then AI generated
  const allCases: (EmergencyCase & { isAI: boolean })[] = [
    ...emergencyCases.map((c) => ({ ...c, isAI: false })),
    ...aiCases.map((c) => ({ ...c, isAI: true })),
  ];

  const filteredCases = allCases.filter((c) => {
    if (selectedComplaint && c.chiefComplaint !== selectedComplaint) return false;
    if (selectedDifficulty && c.difficulty !== selectedDifficulty) return false;
    return true;
  });

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

        {/* Difficulty selector */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            難易度選択（任意）
          </h3>
          <div className="flex flex-wrap gap-3">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all ${
                  selectedDifficulty === d
                    ? difficultyActiveColor[d]
                    : difficultyColor[d]
                }`}
              >
                {d}
              </button>
            ))}
            {selectedDifficulty && (
              <button
                onClick={() => setSelectedDifficulty(null)}
                className="rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* Random start */}
        <button
          onClick={startRandom}
          className="w-full rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors px-6 py-5 text-xl font-bold text-white shadow-lg shadow-red-900/40"
        >
          ランダム症例を開始
          {selectedDifficulty && (
            <span className="ml-2 text-base font-normal opacity-80">
              — {selectedDifficulty}
            </span>
          )}
        </button>

        {/* Chief complaint buttons */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            主訴から始める
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {complaints.map((c) => (
              <button
                key={c}
                onClick={() => startByComplaint(c)}
                className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 transition-all px-2 py-3 text-xs text-slate-200 font-medium"
              >
                <div className="text-2xl mb-1">{complaintEmoji[c] ?? "📋"}</div>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* All cases list with complaint tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              全症例一覧
            </h3>
            <span className="text-xs text-slate-500">{filteredCases.length}件</span>
          </div>

          {/* Complaint filter tabs */}
          <div className="overflow-x-auto pb-2 mb-3">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedComplaint(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                  selectedComplaint === null
                    ? "bg-slate-600 border-slate-400 text-slate-100"
                    : "border-slate-600 text-slate-400 hover:text-slate-200"
                }`}
              >
                すべて
              </button>
              {complaints.map((c) => {
                const count = allCases.filter((cas) => cas.chiefComplaint === c).length;
                if (count === 0) return null;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedComplaint(selectedComplaint === c ? null : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all border whitespace-nowrap ${
                      selectedComplaint === c
                        ? "bg-slate-600 border-slate-400 text-slate-100"
                        : "border-slate-600 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {complaintEmoji[c] ?? "📋"} {c}
                    <span className="ml-1 opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {filteredCases.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">該当する症例がありません</p>
            ) : (
              filteredCases.map((c) => (
                <Link key={c.id} href={`/case/${c.id}`}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all px-4 py-3">
                    <span className="text-xl">{complaintEmoji[c.chiefComplaint] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-200 truncate">{c.title}</span>
                        {c.isAI ? (
                          <span className="text-xs rounded-full px-1.5 py-0.5 bg-purple-900/50 border border-purple-700 text-purple-300 flex-shrink-0">🤖 AI</span>
                        ) : (
                          <span className="text-xs rounded-full px-1.5 py-0.5 bg-slate-700/50 border border-slate-600 text-slate-400 flex-shrink-0">📚</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{c.finalDiagnosis}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`rounded-full text-xs px-2 py-0.5 border ${difficultyBadgeColor[c.difficulty] ?? "border-slate-700 text-slate-400"}`}>
                        {c.difficulty}
                      </span>
                      <span className="text-xs text-slate-500">{c.chiefComplaint}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
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
            {aiLoading ? "生成中..." : "AI症例を生成して開始"}
          </button>
          {aiError && (
            <p className="text-xs text-red-400 rounded-lg bg-red-950/30 border border-red-800 px-3 py-2">
              {aiError}
            </p>
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
