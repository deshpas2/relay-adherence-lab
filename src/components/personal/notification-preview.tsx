import { Zap } from "lucide-react";

/** Looks like an Android notification, so the preview matches the phone. */
export function NotificationPreview({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <div className="rounded-lg bg-[#17283d] p-3.5 text-[#f3f5f4]">
      <div className="flex items-center gap-2 text-xs opacity-75">
        <span className="grid size-4 place-items-center rounded-[4px] bg-[#83b5c0] text-[#17283d]">
          <Zap aria-hidden className="size-3" />
        </span>
        Relay · {time}
      </div>
      <p className="mt-1.5 font-bold">{title}</p>
      <p className="text-sm opacity-90">{body}</p>
    </div>
  );
}
