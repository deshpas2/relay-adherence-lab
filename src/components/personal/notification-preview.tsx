import { Zap } from "lucide-react";

/** Looks like an Android notification, so the preview matches the phone. */
export function NotificationPreview({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <div className="rounded-2xl bg-[#1f2a33] p-3.5 text-[#eef3f6] shadow-md">
      <div className="flex items-center gap-2 text-xs opacity-75">
        <span className="grid size-4 place-items-center rounded-[5px] bg-[#34c56a] text-[#042b12]">
          <Zap aria-hidden className="size-3" />
        </span>
        Relay · {time}
      </div>
      <p className="mt-1.5 font-bold">{title}</p>
      <p className="text-sm opacity-90">{body}</p>
    </div>
  );
}
