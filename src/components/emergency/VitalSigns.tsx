"use client";

type VitalSignsData = {
  bp: string;
  hr: string;
  rr: string;
  spo2: string;
  temp: string;
  consciousness: string;
};

type Props = { vitals: VitalSignsData };

function isAbnormal(type: keyof VitalSignsData, raw: string): boolean {
  const val = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (isNaN(val)) return false;
  switch (type) {
    case "bp": {
      const sys = parseFloat(raw.split("/")[0]);
      return sys < 90 || sys > 180;
    }
    case "hr":
      return val > 100 || val < 50;
    case "rr":
      return val > 20 || val < 12;
    case "spo2":
      return val < 95;
    case "temp":
      return val >= 38.0 || val < 36.0;
    case "consciousness": {
      const lower = raw.toLowerCase();
      if (lower.includes("gcs")) {
        const m = raw.match(/\d+/);
        return m ? parseInt(m[0]) < 15 : false;
      }
      return lower !== "清明" && lower !== "alert" && lower !== "e4v5m6(15)";
    }
    default:
      return false;
  }
}

const vitalsConfig: {
  key: keyof VitalSignsData;
  label: string;
  unit?: string;
}[] = [
  { key: "bp", label: "血圧", unit: "mmHg" },
  { key: "hr", label: "脈拍", unit: "bpm" },
  { key: "rr", label: "呼吸数", unit: "/min" },
  { key: "spo2", label: "SpO₂" },
  { key: "temp", label: "体温", unit: "℃" },
  { key: "consciousness", label: "意識" },
];

export default function VitalSigns({ vitals }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {vitalsConfig.map(({ key, label, unit }) => {
        const abnormal = isAbnormal(key, vitals[key]);
        return (
          <div
            key={key}
            className={`rounded-lg p-3 border ${
              abnormal
                ? "border-red-500 bg-red-950/60 text-red-300"
                : "border-slate-600 bg-slate-800"
            }`}
          >
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div
              className={`text-lg font-bold font-mono ${
                abnormal ? "text-red-300" : "text-slate-100"
              }`}
            >
              {vitals[key]}
              {unit && (
                <span className="text-xs font-normal ml-1 text-slate-400">
                  {unit}
                </span>
              )}
            </div>
            {abnormal && (
              <div className="text-xs text-red-400 mt-1 font-semibold">
                ⚠ 異常値
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
