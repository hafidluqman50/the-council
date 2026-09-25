"use client";

import { useState } from "react";

import { NewThreadComposer } from "@/components/forum/new-thread-composer";
import { Button, type ButtonProps } from "@/components/ui/button";

export function NewThreadTrigger({
  label = "Submit an idea",
  variant = "primary",
  className = "",
}: {
  label?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <NewThreadComposer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
