"use client";

import type { ReactElement, ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

type SheetProps = {
  title: string;
  description?: string;
  /** The button that opens the sheet. Optional if `open` is controlled. */
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/** A pop-up panel: slides up from the bottom on phones, centered on bigger screens. */
export function Sheet({ title, description, trigger, open, onOpenChange, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger render={trigger} />}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#17283d]/55 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-6 overflow-y-auto rounded-t-xl bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-card-foreground shadow-xl outline-none",
            "transition-transform data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
          )}
        >
          <div className="flex flex-col gap-1">
            <Dialog.Title className="text-2xl font-semibold">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-muted-foreground">{description}</Dialog.Description>
            )}
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A button inside a Sheet that closes it. */
export const SheetClose = Dialog.Close;
