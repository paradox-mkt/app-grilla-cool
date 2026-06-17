import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import type { Brand, Publication } from "./types";
import { CAMPAIGNS, formatById, importanceById, platformById } from "./platforms";

export function exportPDF(brand: Brand, pubs: Publication[], rangeLabel: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // Cover
  doc.setFillColor(brand.color);
  doc.rect(0, 0, pageW, 140, "F");
  doc.setTextColor("#fff");
  doc.setFontSize(28);
  doc.text(brand.name, margin, 70);
  doc.setFontSize(14);
  doc.text(rangeLabel, margin, 100);
  doc.setFontSize(10);
  doc.text(`Exportado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, margin, 120);

  y = 180;
  doc.setTextColor("#222");
  doc.setFontSize(20);
  doc.text("Grilla de contenido", margin, y);
  y += 30;

  const grouped = new Map<string, Publication[]>();
  pubs
    .slice()
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
    .forEach((p) => {
      const key = p.publishDate.slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });

  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  for (const [dayKey, items] of grouped) {
    ensureSpace(40);
    doc.setFillColor(brand.color);
    doc.rect(margin, y, 6, 22, "F");
    doc.setFontSize(14);
    doc.setTextColor("#222");
    doc.text(format(parseISO(dayKey), "EEEE, dd 'de' MMMM"), margin + 14, y + 16);
    y += 32;

    for (const p of items) {
      ensureSpace(160);
      const imp = importanceById(p.importance);
      doc.setDrawColor(imp.color);
      doc.setLineWidth(3);
      doc.line(margin, y, margin, y + 130);
      doc.setLineWidth(0.5);
      doc.setDrawColor("#ddd");
      doc.rect(margin + 4, y, pageW - margin * 2 - 4, 130);

      const innerX = margin + 16;
      let innerY = y + 18;

      doc.setFontSize(11);
      doc.setTextColor("#111");
      doc.text(
        `${formatById(p.format).label}  ·  ${p.objective === "paid" ? "Pagado" : "Orgánico"}  ·  ${imp.label}`,
        innerX,
        innerY
      );
      innerY += 14;

      if (p.objective === "paid") {
        const camp = CAMPAIGNS.find((c) => c.id === p.campaign);
        doc.setFontSize(9);
        doc.setTextColor("#555");
        doc.text(
          `${p.paidType === "dark_post" ? "Dark Post" : "Publicación + Anuncio"}${camp ? "  ·  " + camp.label : ""}`,
          innerX,
          innerY
        );
        innerY += 12;
      }

      doc.setFontSize(9);
      doc.setTextColor("#555");
      doc.text(
        `Plataformas: ${p.platforms.map((id) => platformById(id).label).join(", ") || "—"}`,
        innerX,
        innerY
      );
      innerY += 12;
      doc.text(`Entrega: ${format(parseISO(p.deliveryDate), "dd/MM/yyyy")}    Publica: ${format(parseISO(p.publishDate), "dd/MM/yyyy HH:mm")}`, innerX, innerY);
      innerY += 16;

      doc.setFontSize(10);
      doc.setTextColor("#222");
      doc.text("Texto en imagen:", innerX, innerY);
      innerY += 12;
      doc.setTextColor("#444");
      const txtLines = doc.splitTextToSize(p.imageText || "—", pageW - margin * 2 - 30);
      doc.text(txtLines.slice(0, 2), innerX, innerY);
      innerY += 14 * Math.min(txtLines.length, 2);

      doc.setTextColor("#222");
      doc.text("Copy:", innerX, innerY);
      innerY += 12;
      doc.setTextColor("#444");
      const copyLines = doc.splitTextToSize(p.copy || "—", pageW - margin * 2 - 30);
      doc.text(copyLines.slice(0, 3), innerX, innerY);

      y += 145;
    }
    y += 10;
  }

  doc.save(`${brand.name}-${rangeLabel}.pdf`);
}
