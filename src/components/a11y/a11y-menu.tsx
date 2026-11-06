"use client";

import { useId } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Prefs, ThemeChoice } from "@/lib/prefs";
import { LangSwitch } from "./lang-switch";
import { buzz, usePrefs } from "./prefs-store";

type ToggleKey = "highContrast" | "largeText" | "reduceMotion" | "haptics";

const TOGGLES: ToggleKey[] = ["highContrast", "largeText", "reduceMotion", "haptics"];
const THEMES: ThemeChoice[] = ["system", "light", "dark"];

/**
 * The display + accessibility menu (Section 5): theme, high contrast,
 * large text, less motion, haptics, and language. Opens as a bottom sheet.
 */
export function A11yMenu({ className }: { className?: string }) {
  const t = useTranslations("Settings");
  const prefs = usePrefs((s) => s.prefs);
  const update = usePrefs((s) => s.update);

  function toggle(key: ToggleKey, value: boolean) {
    update({ [key]: value } as Partial<Prefs>);
    // A little buzz so the teen feels that haptics are now on.
    if (key === "haptics" && value) buzz(80);
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("open")}
            className={className}
          />
        }
      >
        <Settings2 aria-hidden />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            // Bottom sheet on phones, centered card on bigger screens.
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-6 overflow-y-auto rounded-t-3xl bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-card-foreground shadow-xl",
            "transition-transform data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          )}
        >
          <div className="flex flex-col gap-1">
            <Dialog.Title className="font-heading text-2xl font-semibold">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description className="text-muted-foreground">
              {t("description")}
            </Dialog.Description>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">{t("theme")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((theme) => {
                const active = prefs.theme === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ theme })}
                    className={cn(
                      "min-h-11 rounded-xl border-2 px-2 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {t(`theme_${theme}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <ul className="flex flex-col divide-y rounded-2xl border">
            {TOGGLES.map((key) => (
              <ToggleRow
                key={key}
                label={t(key)}
                hint={t(`${key}Hint`)}
                checked={prefs[key]}
                onChange={(v) => toggle(key, v)}
              />
            ))}
          </ul>

          <LangSwitch label={t("language")} />

          <Dialog.Close render={<Button size="lg" className="w-full" />}>
            {t("done")}
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <li className="flex items-center gap-4 p-4">
      <label htmlFor={id} className="flex flex-1 cursor-pointer flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </li>
  );
}
