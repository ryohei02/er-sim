import { supabase } from "./supabase";
import type { CaseLearningRecord, EmergencyCase, SelfRating } from "@/types/emergency";

function nextReviewDate(rating: SelfRating): string {
  const days = rating === "A" ? 7 : rating === "B" ? 3 : 1;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

type LearningRecordRow = {
  id: string;
  case_id: string;
  rating: SelfRating;
  user_notes: CaseLearningRecord["userNotes"];
  review: CaseLearningRecord["review"];
  weakness_tags: string[];
};

function rowToRecord(row: LearningRecordRow): CaseLearningRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    rating: row.rating,
    userNotes: row.user_notes ?? {},
    review: row.review ?? { playedAt: "", nextReviewAt: "", reviewCount: 0 },
    weaknessTags: row.weakness_tags ?? [],
  };
}

export async function getAllRecords(): Promise<CaseLearningRecord[]> {
  try {
    const { data, error } = await supabase.from("learning_records").select("*");
    if (error) { console.error("getAllRecords:", error); return []; }
    return (data ?? []).map((r) => rowToRecord(r as LearningRecordRow));
  } catch (e) {
    console.error("getAllRecords:", e);
    return [];
  }
}

export async function getRecordByCaseId(caseId: string): Promise<CaseLearningRecord | null> {
  try {
    const { data, error } = await supabase
      .from("learning_records")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();
    if (error) { console.error("getRecordByCaseId:", error); return null; }
    return data ? rowToRecord(data as LearningRecordRow) : null;
  } catch (e) {
    console.error("getRecordByCaseId:", e);
    return null;
  }
}

export async function saveRecord(
  caseId: string,
  rating: SelfRating,
  notes: CaseLearningRecord["userNotes"],
  weaknessTags: string[] = []
): Promise<void> {
  try {
    const existing = await getRecordByCaseId(caseId);
    const now = new Date().toISOString();
    if (existing) {
      const { error } = await supabase
        .from("learning_records")
        .update({
          rating,
          user_notes: notes,
          review: {
            playedAt: now,
            nextReviewAt: nextReviewDate(rating),
            reviewCount: existing.review.reviewCount + 1,
          },
          weakness_tags: weaknessTags,
        })
        .eq("case_id", caseId);
      if (error) console.error("saveRecord update:", error);
    } else {
      const { error } = await supabase.from("learning_records").insert({
        id: `${caseId}-${Date.now()}`,
        case_id: caseId,
        rating,
        user_notes: notes,
        review: {
          playedAt: now,
          nextReviewAt: nextReviewDate(rating),
          reviewCount: 1,
        },
        weakness_tags: weaknessTags,
      });
      if (error) console.error("saveRecord insert:", error);
    }
  } catch (e) {
    console.error("saveRecord:", e);
  }
}

export async function deleteRecord(caseId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("learning_records")
      .delete()
      .eq("case_id", caseId);
    if (error) console.error("deleteRecord:", error);
  } catch (e) {
    console.error("deleteRecord:", e);
  }
}

export type StatsResult = {
  total: number;
  byRating: Record<SelfRating, number>;
  byComplaint: Record<string, { total: number; cCount: number }>;
};

export async function getStats(): Promise<StatsResult> {
  const records = await getAllRecords();
  const byRating: Record<SelfRating, number> = { A: 0, B: 0, C: 0 };
  const byComplaint: Record<string, { total: number; cCount: number }> = {};
  for (const r of records) {
    byRating[r.rating]++;
  }
  return { total: records.length, byRating, byComplaint };
}

export async function getAIGeneratedCases(): Promise<EmergencyCase[]> {
  try {
    const { data, error } = await supabase.from("ai_cases").select("case_data");
    if (error) { console.error("getAIGeneratedCases:", error); return []; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row) => (row as any).case_data as EmergencyCase);
  } catch (e) {
    console.error("getAIGeneratedCases:", e);
    return [];
  }
}

export async function saveAIGeneratedCase(c: EmergencyCase): Promise<void> {
  console.log("[saveAIGeneratedCase] saving id:", c.id);
  try {
    const { error } = await supabase.from("ai_cases").upsert({
      id: c.id,
      title: c.title,
      chief_complaint: c.chiefComplaint,
      difficulty: c.difficulty,
      disease_category: c.diseaseCategory,
      final_diagnosis: c.finalDiagnosis,
      case_data: c,
    });
    if (error) {
      console.error("[saveAIGeneratedCase] error:", error);
    } else {
      console.log("[saveAIGeneratedCase] saved successfully:", c.id);
    }
  } catch (e) {
    console.error("[saveAIGeneratedCase] exception:", e);
  }
}

export async function getAIGeneratedCaseById(id: string): Promise<EmergencyCase | null> {
  console.log("[getAIGeneratedCaseById] querying id:", id);
  try {
    const { data, error } = await supabase
      .from("ai_cases")
      .select("case_data")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[getAIGeneratedCaseById] error:", error);
      return null;
    }
    if (!data) {
      console.warn("[getAIGeneratedCaseById] no row found for id:", id);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caseObj = (data as any).case_data as EmergencyCase;
    console.log("[getAIGeneratedCaseById] case_data.id:", caseObj?.id, "has step1:", !!caseObj?.step1);
    return caseObj ?? null;
  } catch (e) {
    console.error("[getAIGeneratedCaseById] exception:", e);
    return null;
  }
}

export async function deleteAIGeneratedCase(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("ai_cases").delete().eq("id", id);
    if (error) console.error("deleteAIGeneratedCase:", error);
  } catch (e) {
    console.error("deleteAIGeneratedCase:", e);
  }
}

export async function isAIGeneratedCase(id: string): Promise<boolean> {
  return id.startsWith("ai-");
}
