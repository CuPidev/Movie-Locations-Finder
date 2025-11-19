import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import * as React from "react";

export function ShadcnDemoForm() {
    const [value, setValue] = React.useState("");
    const [select, setSelect] = React.useState("option1");
    return (
        <form className="mb-6 flex flex-col gap-4 max-w-sm">
            <div>
                <Label htmlFor="demo-input">shadcn/ui Input</Label>
                <Input
                    id="demo-input"
                    placeholder="Type something..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="demo-select">shadcn/ui Select</Label>
                <Select
                    id="demo-select"
                    value={select}
                    onChange={(e) => setSelect(e.target.value)}
                    className="mt-1"
                >
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </Select>
            </div>
        </form>
    );
}
