import type { Metadata } from "next";
import { BulkScanner } from "@/components/scan/bulk-scanner";
import { PageHeader } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Scan Massal" };
export const dynamic = "force-dynamic";

export default function ScanPage() {
  return (
    <>
      <PageHeader
        title="Scan Keyword Massal"
        description="Tempel banyak keyword sekaligus untuk membandingkan permintaan dan peluangnya dalam satu tabel."
      />
      <BulkScanner />
    </>
  );
}
