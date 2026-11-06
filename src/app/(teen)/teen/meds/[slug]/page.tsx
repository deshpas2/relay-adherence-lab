import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { MedExplorer } from "@/components/meds/med-explorer";
import { getSampleMed } from "@/lib/fixtures/meds";

export default async function MedPage({ params }: PageProps<"/teen/meds/[slug]">) {
  const { slug } = await params;
  const med = getSampleMed(slug);
  if (!med) notFound();
  const locale = (await getLocale()) === "es" ? "es" : "en";
  return <MedExplorer name={med.name} form={med.form} color={med.color} content={med.content[locale]} />;
}
