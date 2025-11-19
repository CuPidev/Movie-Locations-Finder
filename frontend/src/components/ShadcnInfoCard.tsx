import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ShadcnInfoCard() {
    return (
        <Card className="mb-6 border-blue-500">
            <div className="mb-2 font-semibold text-lg text-blue-700">
                Another shadcn/ui Card
            </div>
            <div className="mb-4 text-sm text-muted-foreground">
                This is a second demo using <code>shadcn/ui</code> Card and
                Button. You can freely compose these components for your UI.
            </div>
            <Button
                variant="outline"
                onClick={() => alert("Another shadcn/ui Button!")}
            >
                Another shadcn/ui Button
            </Button>
        </Card>
    );
}
