type TestResult = {
  name: string;
  reason: string;
  result: string;
  interpretation: string;
  imageType?: "ECG" | "Xray" | "CT" | "Echo" | "Ultrasound" | "None";
  imageDescription?: string;
};

type Props = { test: TestResult };

const imageTypeLabel: Record<string, string> = {
  ECG: "心電図",
  Xray: "X線",
  CT: "CT",
  Echo: "心エコー",
  Ultrasound: "超音波",
};

const imageTypeBadgeColor: Record<string, string> = {
  ECG: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
  Xray: "bg-blue-900/60 text-blue-300 border-blue-700",
  CT: "bg-purple-900/60 text-purple-300 border-purple-700",
  Echo: "bg-pink-900/60 text-pink-300 border-pink-700",
  Ultrasound: "bg-teal-900/60 text-teal-300 border-teal-700",
};

function isAbnormalResult(result: string): boolean {
  return /↑|↑↑|↓|陽性|陽|高値|低値|異常|確認|あり|認める/i.test(result);
}

export default function TestResultCard({ test }: Props) {
  const hasImage =
    test.imageType && test.imageType !== "None" && test.imageDescription;
  const abnormal = isAbnormalResult(test.result);

  return (
    <div
      className={`rounded-lg border p-4 ${
        abnormal
          ? "border-orange-700 bg-orange-950/30"
          : "border-slate-600 bg-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-slate-100">{test.name}</h4>
          {hasImage && test.imageType && (
            <span
              className={`text-xs px-2 py-0.5 rounded border ${
                imageTypeBadgeColor[test.imageType] ??
                "bg-slate-700 text-slate-300 border-slate-600"
              }`}
            >
              {imageTypeLabel[test.imageType]}
            </span>
          )}
        </div>
        {abnormal && (
          <span className="text-xs text-orange-400 font-semibold whitespace-nowrap">
            要注意
          </span>
        )}
      </div>

      <div className="text-xs text-slate-400 mb-2">{test.reason}</div>

      <div
        className={`font-mono text-sm font-semibold mb-2 ${
          abnormal ? "text-orange-300" : "text-green-300"
        }`}
      >
        {test.result}
      </div>

      <div className="text-sm text-slate-300">{test.interpretation}</div>

      {hasImage && (
        <div className="mt-3 rounded border border-slate-600 bg-slate-900 p-3">
          <div className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">
            所見テキスト
          </div>
          <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
            {test.imageDescription}
          </p>
        </div>
      )}
    </div>
  );
}
