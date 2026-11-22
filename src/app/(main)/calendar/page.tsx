import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DEADLINE_DAYS_BEFORE } from "@/lib/calendar/schedule";

export const metadata: Metadata = { title: "Kalender Tema" };
export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Kalender Tema"
        description={`Klik event untuk detail dan runway upload. Pembeli menyiapkan konten 1–3 bulan sebelum event, jadi upload paling lambat ${DEADLINE_DAYS_BEFORE} hari sebelum hari H.`}
      />
      <MonthCalendar nowMs={now.getTime()} year={now.getUTCFullYear()} month={now.getUTCMonth()} />
    </>
  );
}
