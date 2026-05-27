import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChiefComplaint, Difficulty } from "@/types/emergency";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは救急医学教育の専門家です。耳鼻科・非内科系当直医向けの救急症例シミュレーション問題を作成してください。

以下の条件を守ってください：
- 必ずJSON形式のみで返答（前置き・後書き・コードブロック不要）
- 医学的に正確で実臨床に即した内容
- 耳鼻科医が当直で遭遇しうるシナリオ
- entDoctorSpecificAdviceは耳鼻科医視点で実践的なアドバイスを記載

返すJSONの型（TypeScript型定義）：
{
  id: string,          // "ai-" + タイムスタンプ
  title: string,
  chiefComplaint: "胸痛"|"腹痛"|"発熱"|"呼吸困難"|"意識障害"|"頭痛"|"めまい"|"動悸"|"失神"|"耳鼻科救急"|"その他",
  difficulty: "初級"|"中級"|"実戦"|"地雷",
  diseaseCategory: string,
  finalDiagnosis: string,
  step1: {
    age: number,
    sex: "男性"|"女性",
    arrivalMethod: "独歩"|"救急搬送"|"家族同伴"|"院内急変",
    chiefComplaintText: string,
    vitalSigns: { bp: string, hr: string, rr: string, spo2: string, temp: string, consciousness: string },
    history: string,
    pastHistory: string,
    medications: string,
    allergies: string,
    physicalExam: string,
    firstImpression: string,
    userTask: string
  },
  step2: {
    emergencyDoctorThinking: string,
    dangerousDifferentials: string[],
    recommendedInitialActions: string[],
    testsOrdered: { name: string, reason: string, result: string, interpretation: string, imageType?: "ECG"|"Xray"|"CT"|"Echo"|"Ultrasound"|"None", imageDescription?: string }[],
    additionalHistory: string,
    userTask: string
  },
  step3: {
    diagnosis: string,
    diagnosticReasoning: string,
    differentials: { disease: string, whyConsidered: string, whyLessLikelyOrRuledOut: string }[],
    treatment: string[],
    disposition: "帰宅"|"入院"|"ICU"|"転院"|"専門科コンサルト"|"経過観察",
    dispositionReason: string,
    consult: string,
    pitfalls: string[],
    learningPoints: string[],
    entDoctorSpecificAdvice: string
  },
  metadata: { tags: string[], createdAt: string, source: "claude-generated" }
}`;

export async function POST(req: NextRequest) {
  try {
    const { chiefComplaint, difficulty } = (await req.json()) as {
      chiefComplaint: ChiefComplaint;
      difficulty: Difficulty;
    };

    if (!chiefComplaint || !difficulty) {
      return NextResponse.json({ error: "chiefComplaint and difficulty are required" }, { status: 400 });
    }

    const userPrompt = `主訴「${chiefComplaint}」、難易度「${difficulty}」の救急症例を1つ作成してください。
idは "ai-${Date.now()}" としてください。
JSON形式のみで返答してください。`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid JSON response from Claude" }, { status: 502 });
    }

    const caseData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ case: caseData });
  } catch (err) {
    console.error("generate-case error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
