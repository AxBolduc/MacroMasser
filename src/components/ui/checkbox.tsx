import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className={cn(
          "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary",
          className,
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute hidden h-3.5 w-3.5 text-primary-foreground peer-checked:block" />
    </span>
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
