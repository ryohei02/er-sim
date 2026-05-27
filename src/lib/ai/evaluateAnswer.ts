import type { EmergencyCase } from "@/types/emergency";

export type EvaluationResult = {
  score: number;
  feedback: string;
  missedPoints: string[];
  correctPoints: string[];
};

// TODO: implement Claude API call to evaluate user's differential diagnosis and plan
// POST /api/claude/evaluate with caseId + userNotes in body
// Returns structured feedback comparing user answers to expected reasoning
export async function evaluateAnswer(
  _caseData: EmergencyCase,
  _userNotes: { differentials?: string; plan?: string }
): Promise<EvaluationResult> {
  throw new Error("Claude API integration not yet implemented");
}
