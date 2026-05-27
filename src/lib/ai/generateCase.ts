import type { EmergencyCase, ChiefComplaint, Difficulty } from "@/types/emergency";

export type GenerateCaseOptions = {
  chiefComplaint?: ChiefComplaint;
  difficulty?: Difficulty;
};

export async function generateCaseWithAI(
  chiefComplaint: ChiefComplaint,
  difficulty: Difficulty
): Promise<EmergencyCase> {
  const res = await fetch("/api/claude/generate-case", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chiefComplaint, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.case as EmergencyCase;
}

export async function generateCase(options: GenerateCaseOptions): Promise<EmergencyCase> {
  const chiefComplaint = options.chiefComplaint ?? "その他";
  const difficulty = options.difficulty ?? "中級";
  return generateCaseWithAI(chiefComplaint, difficulty);
}
