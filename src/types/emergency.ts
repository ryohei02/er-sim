export type SelfRating = "A" | "B" | "C";
export type Difficulty = "初級" | "中級" | "実戦" | "地雷";
export type Frequency = "高" | "中" | "低";
export type ChiefComplaint =
  | "胸痛"
  | "腹痛"
  | "発熱"
  | "呼吸困難"
  | "意識障害"
  | "頭痛"
  | "めまい"
  | "動悸"
  | "失神"
  | "耳鼻科救急"
  | "腰背部痛"
  | "麻痺・しびれ"
  | "浮腫"
  | "嘔吐・下痢"
  | "痙攣"
  | "皮疹"
  | "精神科的主訴"
  | "その他"
  | "CPA"
  | "骨折・外傷"
  | "泌尿器"
  | "咳・喀血"
  | "外傷・頭部打撲"
  | "薬物中毒・過量服薬";

export type EmergencyCase = {
  id: string;
  title: string;
  chiefComplaint: ChiefComplaint;
  difficulty: Difficulty;
  frequency: Frequency;
  diseaseCategory: string;
  finalDiagnosis: string;
  step1: {
    age: number;
    sex: "男性" | "女性";
    arrivalMethod: "独歩" | "救急搬送" | "家族同伴" | "院内急変";
    chiefComplaintText: string;
    vitalSigns: {
      bp: string;
      hr: string;
      rr: string;
      spo2: string;
      temp: string;
      consciousness: string;
    };
    history: string;
    pastHistory: string;
    medications: string;
    allergies: string;
    physicalExam: string;
    firstImpression: string;
    userTask: string;
  };
  step2: {
    emergencyDoctorThinking: string;
    dangerousDifferentials: string[];
    recommendedInitialActions: string[];
    testsOrdered: {
      name: string;
      reason: string;
      result: string;
      interpretation: string;
      imageType?: "ECG" | "Xray" | "CT" | "Echo" | "Ultrasound" | "None";
      imageDescription?: string;
    }[];
    additionalHistory: string;
    userTask: string;
  };
  step3: {
    diagnosis: string;
    diagnosticReasoning: string;
    differentials: {
      disease: string;
      whyConsidered: string;
      whyLessLikelyOrRuledOut: string;
    }[];
    treatment: string[];
    disposition: "帰宅" | "入院" | "ICU" | "転院" | "専門科コンサルト" | "経過観察";
    dispositionReason: string;
    consult: string;
    pitfalls: string[];
    learningPoints: string[];
    entDoctorSpecificAdvice?: string;
  };
  metadata: {
    tags: string[];
    createdAt: string;
    source: "preset" | "claude-generated";
  };
};

export type CaseLearningRecord = {
  id: string;
  caseId: string;
  rating: SelfRating;
  userNotes: {
    step1Differentials?: string;
    step1Tests?: string;
    step2Diagnosis?: string;
    step2Treatment?: string;
    reflection?: string;
  };
  review: {
    playedAt: string;
    nextReviewAt: string;
    reviewCount: number;
  };
  weaknessTags: string[];
};
