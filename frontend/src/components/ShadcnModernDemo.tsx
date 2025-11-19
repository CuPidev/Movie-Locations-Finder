import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Moon, Search, Sun } from "lucide-react";
import * as React from "react";

export function ShadcnModernDemo() {
    const [theme, setTheme] = React.useState<"light" | "dark">("light");
    const [input, setInput] = React.useState("");
    return (
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4 p-6 rounded-2xl border bg-gradient-to-br from-background to-muted shadow-lg">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                    className="rounded-full px-4 py-2 shadow focus:ring-2 focus:ring-primary"
                    placeholder="Search modern UI..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <Button
                    className="rounded-full px-4 py-2"
                    size="sm"
                    variant="default"
                >
                    <Search className="w-4 h-4 mr-1" />
                    Search
                </Button>
            </div>
            <Button
                variant="ghost"
                className="rounded-full px-3 py-2 flex items-center gap-2 text-base"
                onClick={() =>
                    setTheme((t) => (t === "light" ? "dark" : "light"))
                }
            >
                {theme === "light" ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
                {theme === "light" ? "Light" : "Dark"} mode
            </Button>
            <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Modern shadcn/ui + Lucide
            </div>
        </div>
    );
}
