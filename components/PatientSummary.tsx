import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PatientSummary({ summary }: { summary: string }) {
  return (
    <Alert>
      <AlertTitle>Patient Summary</AlertTitle>
      <AlertDescription className="mt-1 leading-relaxed">
        {summary}
      </AlertDescription>
    </Alert>
  );
}
