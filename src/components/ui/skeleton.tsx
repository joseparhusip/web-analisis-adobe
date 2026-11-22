import { Card, CardBody, CardHeader } from "./card";

export function SectionSkeleton({ title, description }: { title: string; description?: string }) {
  return (
    <Card aria-busy="true">
      <CardHeader title={title} description={description ?? "Mengumpulkan data…"} />
      <CardBody className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </CardBody>
    </Card>
  );
}
