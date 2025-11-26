import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ShadcnDemoCard() {
    return (
        <Card className="mb-6">
            <div className="mb-2 font-semibold text-lg">
                shadcn/ui Demo Card
            </div>
            <div className="mb-4 text-sm text-muted-foreground">
                This card and button are rendered using <code>shadcn/ui</code>{" "}
                components. You can use these to build modern, accessible UIs.
            </div>
            <Button onClick={() => alert("shadcn/ui Button clicked!")}>
                shadcn/ui Button
            </Button>
        </Card>
    );
}
