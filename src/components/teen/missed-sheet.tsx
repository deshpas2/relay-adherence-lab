"use client";

import { HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose } from "@/components/ui/sheet";

type MissedSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

/**
 * The kind path for a missed dose (Section 6.3). No shame, no advice about
 * what to take: questions about a missed dose go to the care team.
 */
export function MissedSheet({ open, onOpenChange, onConfirm }: MissedSheetProps) {
  const t = useTranslations("TeenHome");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("missedTitle")} description={t("missedBody")}>
      <p className="flex items-start gap-3 rounded-lg bg-secondary p-4 text-secondary-foreground">
        <HeartHandshake aria-hidden className="mt-0.5 size-5 shrink-0" />
        {t("missedCareTeam")}
      </p>
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onConfirm}>
          {t("missedConfirm")}
        </Button>
        <SheetClose render={<Button variant="ghost" className="w-full" />}>{t("missedBack")}</SheetClose>
      </div>
    </Sheet>
  );
}
