import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/cms";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Lien he", description: "Gui yeu cau tu van san pham AIVisionary." };

export default async function ContactPage() {
  const catalog = await getCatalog();
  return (
    <Suspense fallback={<section className="container section">Dang tai form...</section>}>
      <ContactForm settings={catalog.settings} />
    </Suspense>
  );
}
