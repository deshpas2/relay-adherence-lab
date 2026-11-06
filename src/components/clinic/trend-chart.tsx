"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { week: string; selfReported: number; verified: number };

/** Self-reported vs parent-verified on-time rate, kept visibly distinct (Section 6.3). */
export function TrendChart({
  data,
  labels,
}: {
  data: Point[];
  labels: { selfReported: string; verified: string; target: string; summary: string };
}) {
  return (
    <figure className="m-0">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 12 }} />
            <ReferenceLine y={85} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: labels.target, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Line type="monotone" dataKey="selfReported" name={labels.selfReported} stroke="var(--chart-1)" strokeWidth={2.2} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="verified" name={labels.verified} stroke="var(--chart-2)" strokeWidth={2.2} strokeDasharray="6 4" dot={false} activeDot={{ r: 5 }} />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{labels.summary}</figcaption>
    </figure>
  );
}
