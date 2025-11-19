import * as React from "react";

// Simple shadcn/ui Switch implementation
export function ShadcnDemoSwitch() {
    const [on, setOn] = React.useState(false);
    return (
        <div className="mb-6 flex items-center gap-3">
            <label className="flex items-center cursor-pointer select-none">
                <span className="mr-2 text-sm">shadcn/ui Switch</span>
                <span className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                    <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setOn(e.target.checked)}
                        className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-200 left-0 top-0 shadow focus:outline-none"
                        style={{ left: on ? "1.25rem" : "0" }}
                    />
                    <span
                        className={
                            "block overflow-hidden h-6 rounded-full bg-gray-300 transition-colors duration-200 " +
                            (on ? "bg-blue-500" : "bg-gray-300")
                        }
                        style={{ width: "2.5rem" }}
                    />
                </span>
            </label>
            <span className="text-sm text-muted-foreground">
                {on ? "On" : "Off"}
            </span>
        </div>
    );
}
