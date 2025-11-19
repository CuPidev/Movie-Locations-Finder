import { cn } from "@/lib/utils";
import * as React from "react";

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, ...props }, ref) => {
        return (
            <select
                className={cn(
                    "border border-input rounded-md bg-background px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Select.displayName = "Select";

export { Select };
