"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { emergencyCases } from "@/data/emergencyCases";
import { saveRecord, getRecordByCaseId, getAIGeneratedCaseById } from "@/lib/emergencyStorage";
import VitalSigns from "@/components/emergency/VitalSigns";
import ChecklistBox from "@/components/emergency/ChecklistBox";
import TestResultCard from "@/components/emergency/TestResultCard";
import RatingButtons from "@/components/emergency/RatingButtons";
import type { EmergencyCase, SelfRating } from "@/types/emergency";

const ABCDE_CHECKLIST = [
  "A: 気道（開通確認・呼吸音）",
  "B: 呼吸（回数・SpO2・努力呼吸）",
  "C: 循環（血圧・脈拍・末梢循環・出血）",
  "D: 意識（GCS・瞳孔・血糖）",
  "E: 脱衣・環境（外傷・皮疹・体温）",
  "ショック評価（頻脈・低血圧・冷汗・意識障害）",
  "危険疾患を3つ以上挙げた",
];

const difficultyColor: Record<string, string> = {
  初級: "bg-green-900 text-green-300 border-green-700",
  中級: "bg-blue-900 text-blue-300 border-blue-700",
  実戦: "bg-orange-900 text-orange-300 border-orange-700",
  地雷: "bg-red-900 text-red-300 border-red-700",
};

const STEP_LABELS = ["症例提示", "検査結果", "診断・治療", "自己評価"];

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [caseData, setCaseData] = useState<EmergencyCase | undefined>(undefined);
  const [caseLoading, setCaseLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [memos, setMemos] = useState({
    step1Differentials: "",
    step1Tests: "",
    step2Diagnosis: "",
    step2Treatment: "",
    reflection: "",
  });
  const [rating, setRating] = useState<SelfRating | null>(null);

  useEffect(() => {
    console.log("[CasePage] id from URL params:", id);
    const preset = emergencyCases.find((c) => c.id === id);
    if (preset) {
      console.log("[CasePage] found preset case:", preset.id);
      setCaseData(preset);
      setCaseLoading(false);
      return;
    }
    console.log("[CasePage] not a preset case, querying Supabase...");
    getAIGeneratedCaseById(id)
      .then((found) => {
        console.log("[CasePage] getAIGeneratedCaseById returned:", JSON.stringify(found)?.slice(0, 200));
        if (!found) {
          console.warn("[CasePage] case not found in Supabase for id:", id);
          return;
        }
        // フォールバック: case_data が入れ子になって返ってきた場合に対応
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = found as any;
        const caseObj: EmergencyCase =
          raw.step1 !== undefined
            ? (found as EmergencyCase)           // 正常: EmergencyCase が直接返ってきた
            : raw.case_data !== undefined
            ? (raw.case_data as EmergencyCase)  // フォールバック: row がそのまま返ってきた
            : found;
        console.log("[CasePage] final caseObj.id:", caseObj.id, "has step1:", !!caseObj.step1);
        setCaseData(caseObj);
      })
      .catch((e) => console.error("[CasePage] Supabase error:", e))
      .finally(() => setCaseLoading(false));
  }, [id]);

  useEffect(() => {
    if (!caseData) return;
    getRecordByCaseId(id)
      .then((existing) => {
        if (existing) {
          setMemos({
            step1Differentials: existing.userNotes.step1Differentials ?? "",
            step1Tests: existing.userNotes.step1Tests ?? "",
            step2Diagnosis: existing.userNotes.step2Diagnosis ?? "",
            step2Treatment: existing.userNotes.step2Treatment ?? "",
            reflection: existing.userNotes.reflection ?? "",
          });
          setRating(existing.rating);
        }
      })
      .catch((e) => console.error(e));
  }, [id, caseData]);

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">症例が見つかりません</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  function toggleCheck(item: string) {
    setChecked((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function downloadCaseAsText() {
    if (!caseData) return;
    const { step1: s1, step2: s2, step3: s3 } = caseData;
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const fileDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const bullet = (items: string[]) => items.map((x) => `・${x}`).join("\n");
    const tests = s2.testsOrdered
      .map((t) => `・${t.name}：${t.result}（${t.interpretation}）`)
      .join("\n");

    const content = [
      "=================================",
      `【救急症例】${caseData.title}`,
      `主訴：${caseData.chiefComplaint} / 難易度：${caseData.difficulty}`,
      `最終診断：${caseData.finalDiagnosis}`,
      "=================================",
      "",
      "■ 症例提示",
      `年齢・性別：${s1.age}歳 ${s1.sex}`,
      `来院方法：${s1.arrivalMethod}`,
      `主訴：${s1.chiefComplaintText}`,
      `バイタル：BP ${s1.vitalSigns.bp} / HR ${s1.vitalSigns.hr} / RR ${s1.vitalSigns.rr} / SpO2 ${s1.vitalSigns.spo2} / 体温 ${s1.vitalSigns.temp} / 意識 ${s1.vitalSigns.consciousness}`,
      `現病歴：${s1.history}`,
      `既往歴：${s1.pastHistory}`,
      `内服薬：${s1.medications}`,
      `身体所見：${s1.physicalExam}`,
      "",
      "■ 救急医の思考",
      s2.emergencyDoctorThinking,
      "",
      "■ 見逃してはいけない疾患",
      bullet(s2.dangerousDifferentials),
      "",
      "■ 検査結果",
      tests,
      "",
      "■ 最終診断",
      s3.diagnosis,
      "",
      "■ 診断根拠",
      s3.diagnosticReasoning,
      "",
      "■ 治療",
      bullet(s3.treatment),
      "",
      `■ 入院/帰宅判断`,
      `${s3.disposition}：${s3.dispositionReason}`,
      "",
      "■ 相談先",
      s3.consult,
      "",
      "■ この症例の落とし穴",
      bullet(s3.pitfalls),
      "",
      "■ 学習ポイント",
      bullet(s3.learningPoints),
      ...(s3.entDoctorSpecificAdvice
        ? ["", "■ 耳鼻科医・非内科当直医としての注意", s3.entDoctorSpecificAdvice]
        : []),
      "",
      "=================================",
      `ダウンロード日時：${dateStr}`,
      "このファイルは教育用シミュレーションです。",
      "実際の医療判断には使用しないでください。",
      "=================================",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emergency-case-${caseData.chiefComplaint}-${caseData.finalDiagnosis}-${fileDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveAndFinish(r: SelfRating) {
    setRating(r);
    void saveRecord(id, r, memos, caseData?.metadata.tags ?? []);
  }

  function goToReview() {
    router.push("/review");
  }

  const s1 = caseData.step1;
  const s2 = caseData.step2;
  const s3 = caseData.step3;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 mt-0.5">
              ← 戻る
            </Link>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${difficultyColor[caseData.difficulty]}`}>
                {caseData.difficulty}
              </span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                {caseData.chiefComplaint}
              </span>
            </div>
          </div>
          <h1 className="text-sm font-semibold text-slate-200 leading-snug mb-2 truncate">
            {caseData.title}
          </h1>
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const isActive = step === n;
              const isDone = step > n;
              return (
                <div key={n} className="flex items-center gap-1 flex-1 min-w-0">
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : isDone
                        ? "bg-green-800 text-green-200"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    <span>{isDone ? "✓" : n}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${isDone ? "bg-green-700" : "bg-slate-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6 pb-24">

        {/* ===== STEP 1 ===== */}
        {step === 1 && (
          <>
            <Section title="患者情報">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-slate-400">年齢・性別: </span>
                  <span className="font-semibold text-slate-100">{s1.age}歳 {s1.sex}</span>
                </div>
                <div>
                  <span className="text-slate-400">来院方法: </span>
                  <span className="font-semibold text-slate-100">{s1.arrivalMethod}</span>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-slate-700/60 px-3 py-2 text-sm">
                <span className="text-slate-400">主訴: </span>
                <span className="font-semibold text-slate-100">{s1.chiefComplaintText}</span>
              </div>
              <div className="mt-2 rounded-lg bg-yellow-950/40 border border-yellow-800 px-3 py-2 text-sm text-yellow-200">
                <span className="font-semibold">第一印象: </span>
                {s1.firstImpression}
              </div>
            </Section>

            <Section title="バイタルサイン">
              <VitalSigns vitals={s1.vitalSigns} />
            </Section>

            <Section title="病歴・身体所見">
              <InfoRow label="現病歴" value={s1.history} />
              <InfoRow label="既往歴" value={s1.pastHistory} />
              <InfoRow label="内服薬" value={s1.medications} />
              <InfoRow label="アレルギー" value={s1.allergies} />
              <InfoRow label="身体所見" value={s1.physicalExam} />
            </Section>

            <ChecklistBox
              title="初期対応チェックリスト（ABCDE）"
              items={ABCDE_CHECKLIST}
              checked={checked}
              onToggle={toggleCheck}
            />

            <Section title="あなたのメモ（Step 1）">
              <p className="text-xs text-slate-400 mb-3">{s1.userTask}</p>
              <MemoArea
                label="鑑別診断（思いつくだけ）"
                value={memos.step1Differentials}
                onChange={(v) => setMemos((m) => ({ ...m, step1Differentials: v }))}
              />
              <MemoArea
                label="検査計画・初期対応"
                value={memos.step1Tests}
                onChange={(v) => setMemos((m) => ({ ...m, step1Tests: v }))}
              />
            </Section>

            <NextButton onClick={() => setStep(2)} label="Step 2 へ：救急医の思考と検査結果" />
          </>
        )}

        {/* ===== STEP 2 ===== */}
        {step === 2 && (
          <>
            <Section title="救急医の初期思考">
              <div className="rounded-lg bg-slate-700/60 p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {s2.emergencyDoctorThinking}
              </div>
            </Section>

            <Section title="見逃してはいけない疾患">
              <div className="space-y-2">
                {s2.dangerousDifferentials.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-red-700 bg-red-950/40 px-3 py-2">
                    <span className="text-red-400 font-bold mt-0.5">!</span>
                    <span className="text-sm text-red-200">{d}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="推奨される初期対応">
              <ul className="space-y-1">
                {s2.recommendedInitialActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 font-bold mt-0.5">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {s2.additionalHistory && (
              <Section title="追加情報">
                <div className="rounded-lg bg-slate-700/60 px-3 py-2 text-sm text-slate-300">
                  {s2.additionalHistory}
                </div>
              </Section>
            )}

            <Section title="検査結果">
              <div className="space-y-3">
                {s2.testsOrdered.map((t, i) => (
                  <TestResultCard key={i} test={t} />
                ))}
              </div>
            </Section>

            <Section title="あなたのメモ（Step 2）">
              <p className="text-xs text-slate-400 mb-3">{s2.userTask}</p>
              <MemoArea
                label="診断（最終診断・確信度）"
                value={memos.step2Diagnosis}
                onChange={(v) => setMemos((m) => ({ ...m, step2Diagnosis: v }))}
              />
              <MemoArea
                label="治療方針・入院/帰宅判断"
                value={memos.step2Treatment}
                onChange={(v) => setMemos((m) => ({ ...m, step2Treatment: v }))}
              />
            </Section>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                ← 戻る
              </button>
              <NextButton onClick={() => setStep(3)} label="Step 3 へ：診断・治療・解説" className="flex-1" />
            </div>
          </>
        )}

        {/* ===== STEP 3 ===== */}
        {step === 3 && (
          <>
            {/* Final diagnosis */}
            <div className="rounded-xl border-2 border-blue-500 bg-blue-950/40 p-4">
              <div className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">最終診断</div>
              <div className="text-xl font-bold text-blue-100">{s3.diagnosis}</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">{s3.diagnosticReasoning}</div>
            </div>

            {/* Differentials */}
            <Section title="鑑別診断と除外理由">
              <div className="space-y-3">
                {s3.differentials.map((d, i) => (
                  <div key={i} className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-sm">
                    <div className="font-semibold text-slate-200 mb-1">{d.disease}</div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">考えた理由: </span>{d.whyConsidered}
                    </div>
                    <div className="text-green-400 mt-1">
                      <span className="text-slate-500">除外/可能性低: </span>{d.whyLessLikelyOrRuledOut}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Treatment */}
            <Section title="治療内容">
              <ul className="space-y-2">
                {s3.treatment.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="text-green-400 mt-0.5 font-bold">→</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Disposition */}
            <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">入院/帰宅判断</span>
                <span className="rounded-full bg-purple-800 text-purple-100 px-3 py-0.5 text-sm font-bold">
                  {s3.disposition}
                </span>
              </div>
              <p className="text-sm text-slate-300">{s3.dispositionReason}</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-400">相談先: </span>
                <span className="text-slate-200">{s3.consult}</span>
              </div>
            </div>

            {/* Pitfalls */}
            <Section title="この症例の落とし穴">
              <div className="space-y-2">
                {s3.pitfalls.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-red-700 bg-red-950/40 px-3 py-2">
                    <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">⚠</span>
                    <span className="text-sm text-red-200">{p}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* ENT advice */}
            {s3.entDoctorSpecificAdvice && (
              <div className="rounded-xl border-2 border-yellow-600 bg-yellow-950/30 p-4">
                <div className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-2">
                  耳鼻科医・非内科当直医へのアドバイス
                </div>
                <p className="text-sm text-yellow-200 leading-relaxed">
                  {s3.entDoctorSpecificAdvice}
                </p>
              </div>
            )}

            {/* Learning points */}
            <div className="rounded-xl border-2 border-blue-600 bg-blue-950/30 p-4">
              <div className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-3">
                学習ポイント
              </div>
              <ul className="space-y-2">
                {s3.learningPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-100">
                    <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={downloadCaseAsText}
              className="w-full rounded-xl border border-blue-600 bg-blue-950/40 hover:bg-blue-950/70 transition-colors px-4 py-3 text-sm font-semibold text-blue-300 flex items-center justify-center gap-2"
            >
              <span>📄</span>
              この症例をダウンロード
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                ← 戻る
              </button>
              <NextButton onClick={() => setStep(4)} label="Step 4 へ：自己評価" className="flex-1" />
            </div>
          </>
        )}

        {/* ===== STEP 4 ===== */}
        {step === 4 && (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl">🎯</div>
              <h2 className="text-xl font-bold text-slate-100">自己評価</h2>
              <p className="text-slate-400 text-sm">この症例の理解度を評価してください</p>
            </div>

            <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
              <div className="text-xs text-slate-400 font-semibold mb-2">最終診断</div>
              <div className="font-bold text-blue-300">{s3.diagnosis}</div>
            </div>

            <RatingButtons selected={rating} onSelect={handleSaveAndFinish} />

            {rating && (
              <div className={`rounded-xl border p-3 text-sm text-center ${
                rating === "A" ? "border-green-600 bg-green-950/40 text-green-300"
                : rating === "B" ? "border-yellow-600 bg-yellow-950/40 text-yellow-300"
                : "border-red-600 bg-red-950/40 text-red-300"
              }`}>
                {rating === "A" && "素晴らしい！この症例はマスターしました。"}
                {rating === "B" && "もう少しで完璧。重要なポイントを確認しましょう。"}
                {rating === "C" && "復習が必要です。落とし穴と学習ポイントを読み返しましょう。"}
              </div>
            )}

            <Section title="振り返りメモ（任意）">
              <MemoArea
                label="この症例で学んだこと・反省点"
                value={memos.reflection}
                onChange={(v) => setMemos((m) => ({ ...m, reflection: v }))}
                rows={4}
              />
            </Section>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                ← 戻る
              </button>
              {rating && (
                <button
                  onClick={goToReview}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  保存して復習ページへ →
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* Sub-components */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{value}</div>
    </div>
  );
}

function MemoArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-y focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="ここに記入..."
      />
    </div>
  );
}

function NextButton({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors ${className}`}
    >
      {label} →
    </button>
  );
}
