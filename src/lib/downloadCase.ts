import type { EmergencyCase } from "@/types/emergency";

export function downloadCaseAsText(caseData: EmergencyCase): void {
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
    "■ 入院/帰宅判断",
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
