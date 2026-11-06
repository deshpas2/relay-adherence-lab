"use client";

import { useEffect } from "react";
import { bubbleUp } from "./bubbles";

/**
 * Big celebration (e.g. a finished 2-week test): a full-screen bubble-up of
 * hearts and smiley faces. Renders nothing itself; the Bubbles layer draws it.
 */
export function Confetti() {
  useEffect(() => {
    bubbleUp(true);
  }, []);
  return null;
}
