import { Button, Select } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const THEMES = [
    { id: "teal", label: "Teal" },
    { id: "indigo", label: "Indigo" },
    { id: "terracotta", label: "Warm" },
    { id: "olive", label: "Olive" },
];
const STORAGE_KEY = "hsf:theme"; // legacy key may contain a plain string
const STORAGE_KEY_JSON = "hsf:theme:v2"; // new storage format with mode

type Stored = {
    theme: string;
    mode: "light" | "dark";
};

function readStored(): Stored {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_JSON);
        if (raw) return JSON.parse(raw) as Stored;
        // fallback to old single-string storage
        const old = localStorage.getItem(STORAGE_KEY);
        if (old) return { theme: old, mode: "light" };
    } catch (e) {
        /* ignore */
    }
    return { theme: THEMES[0].id, mode: "light" };
}

export default function ThemeSelector() {
    const initial = readStored();
    const [theme, setTheme] = useState<string>(initial.theme);
    const [mode, setMode] = useState<"light" | "dark">(initial.mode);

    // apply theme classes
    useEffect(() => {
        const root = document.documentElement;
        THEMES.forEach((t) => root.classList.remove("theme-" + t.id));
        if (theme) root.classList.add("theme-" + theme);
        try {
            localStorage.setItem(
                STORAGE_KEY_JSON,
                JSON.stringify({ theme, mode })
            );
        } catch (e) {}
    }, [theme, mode]);

    // apply dark mode class
    useEffect(() => {
        const root = document.documentElement;
        if (mode === "dark") root.classList.add("theme-dark");
        else root.classList.remove("theme-dark");
    }, [mode]);

    return (
        <span className="inline-flex items-center gap-2">
            <Select
                id="theme-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="ml-2 text-sm"
                aria-label="Accent color"
            >
                {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.label}
                    </option>
                ))}
            </Select>

            <Button
                aria-pressed={mode === "dark"}
                onClick={() =>
                    setMode((m) => (m === "dark" ? "light" : "dark"))
                }
                title={
                    mode === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                }
                className="ml-1 px-2 py-1 text-sm"
                variant={mode === "dark" ? undefined : "outline"}
            >
                {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
            </Button>
        </span>
    );
}
