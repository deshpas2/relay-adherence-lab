"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/** An on/off toggle. Track is 52x32; the whole row around it should be tappable. */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-8 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors data-[checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-6 translate-x-0.5 rounded-full bg-[var(--mist)] ring-1 ring-black/10 transition-transform data-[checked]:translate-x-5.5 data-[checked]:bg-primary-foreground" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
