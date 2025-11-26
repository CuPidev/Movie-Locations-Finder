import { Button } from "@/components/ui/button";

export function ShadcnDemoButton() {
    return (
        <div className="mb-6 flex items-center gap-4">
            <Button onClick={() => alert("shadcn/ui Button!")}>
                Standalone shadcn/ui Button
            </Button>
            <Button variant="outline" onClick={() => alert("Outline variant!")}>
                Outline Button
            </Button>
        </div>
    );
}
