import { supabase } from "./supabase";
import type { CaseLearningRecord, EmergencyCase, SelfRating } from "@/types/emergency";

function nextReviewDate(rating: SelfRating): string {
  const days = rating === "A" ? 30 : rating === "B" ? 7 : 1;
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
    const { data, error } = await supabase
      .from("ai_cases")
      .select("id, case_data, chief_complaint");
    if (error) { console.error("[getAIGeneratedCases] error:", error); return []; }
    console.log("[getAIGeneratedCases] rows fetched:", data?.length ?? 0);
    const cases = (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => {
        const caseObj = row.case_data as EmergencyCase | null;
        if (!caseObj) {
          console.warn("[getAIGeneratedCases] null case_data for id:", row.id);
          return null;
        }
        // Use the dedicated DB column as the authoritative chiefComplaint value.
        // This guards against case_data storing a different/unexpected value.
        if (row.chief_complaint && caseObj.chiefComplaint !== row.chief_complaint) {
          console.warn(
            "[getAIGeneratedCases] chiefComplaint mismatch — db:",
            row.chief_complaint,
            "case_data:",
            caseObj.chiefComplaint,
            "→ using db value"
          );
          caseObj.chiefComplaint = row.chief_complaint as EmergencyCase["chiefComplaint"];
        }
        return caseObj;
      })
      .filter((c): c is EmergencyCase => c !== null);
    console.log("[getAIGeneratedCases] valid cases:", cases.length);
    return cases;
  } catch (e) {
    console.error("[getAIGeneratedCases] exception:", e);
    return [];
  }
}

export async function saveAIGeneratedCase(c: EmergencyCase): Promise<void> {
  console.log(
    "[saveAIGeneratedCase] saving id:", c.id,
    "chiefComplaint:", c.chiefComplaint,
    "difficulty:", c.difficulty
  );
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
    console.error("[saveAIGeneratedCase] upsert error:", error);
    throw new Error(`症例の保存に失敗しました: ${error.message}`);
  }
  console.log("[saveAIGeneratedCase] saved successfully:", c.id);
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
