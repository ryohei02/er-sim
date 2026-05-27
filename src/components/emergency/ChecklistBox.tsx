"use client";

type Props = {
  title: string;
  items: string[];
  checked: string[];
  onToggle: (item: string) => void;
};

export default function ChecklistBox({ title, items, checked, onToggle }: Props) {
  const allChecked = items.every((i) => checked.includes(i));
  const progress = items.filter((i) => checked.includes(i)).length;

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <span className="text-xs text-slate-400">
          {progress}/{items.length}
          {allChecked && (
            <span className="ml-2 text-green-400 font-semibold">完了</span>
          )}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const isChecked = checked.includes(item);
          return (
            <label
              key={item}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  isChecked
                    ? "border-green-500 bg-green-500"
                    : "border-slate-500 group-hover:border-slate-400"
                }`}
                onClick={() => onToggle(item)}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm leading-5 ${
                  isChecked ? "line-through text-slate-500" : "text-slate-300"
                }`}
                onClick={() => onToggle(item)}
              >
                {item}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
