import { notFound } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { XPBar } from "@/components/game/xp-bar";
import { LevelBadge } from "@/components/game/level-badge";
import { ProgressRing } from "@/components/game/progress-ring";
import { A11yMenu } from "@/components/a11y/a11y-menu";
import { AppSwitcher } from "./theme-switcher";

/*
 * Dev-only preview of the design system. Hidden in production.
 * The English text here is sample copy for previewing, not real app copy;
 * real screens take every string from src/messages/*.json.
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const swatches = [
    ["background", "bg-background"],
    ["card", "bg-card"],
    ["primary", "bg-primary"],
    ["secondary", "bg-secondary"],
    ["muted", "bg-muted"],
    ["accent", "bg-accent"],
    ["xp", "bg-xp"],
    ["success", "bg-success"],
    ["border", "bg-border"],
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl">Relay design system</h1>
          <A11yMenu />
        </div>
        <AppSwitcher />
      </header>

      <section aria-labelledby="colors" className="flex flex-col gap-3">
        <h2 id="colors" className="text-2xl">Colors</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {swatches.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className={`h-14 rounded-xl border ${cls}`} />
              <span className="text-sm text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="type" className="flex flex-col gap-2">
        <h2 id="type" className="text-2xl">Type</h2>
        <p className="font-heading text-3xl font-semibold">
          Fredoka for headings
        </p>
        <p>Inter for body text. It stays at 16px or bigger so it is easy to read.</p>
        <p className="text-muted-foreground">Muted text for hints and labels.</p>
      </section>

      <section aria-labelledby="buttons" className="flex flex-col gap-3">
        <h2 id="buttons" className="text-2xl">Buttons</h2>
        <Button size="xl">
          <Check aria-hidden /> Took it
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Not yet</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Sparkle">
            <Sparkles aria-hidden />
          </Button>
        </div>
      </section>

      <section aria-labelledby="game" className="flex flex-col gap-3">
        <h2 id="game" className="text-2xl">Game pieces</h2>
        <Card className="flex items-center gap-4">
          <LevelBadge level={3} label="Level" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between text-sm font-medium">
              <span>140 XP</span>
              <span className="text-muted-foreground">60 to level 4</span>
            </div>
            <XPBar current={140} goal={200} label="140 of 200 XP to level 4" />
          </div>
        </Card>
        <Card className="flex items-center gap-5">
          <ProgressRing value={7 / 14} label="Day 7 of 14">
            <span className="font-heading text-xl font-semibold">7/14</span>
          </ProgressRing>
          <div className="flex flex-col gap-1">
            <CardTitle>Morning Routine Challenge</CardTitle>
            <CardDescription>
              You&apos;re halfway! Keep going to see what works best.
            </CardDescription>
          </div>
        </Card>
      </section>
    </main>
  );
}
