import pptxgen from "pptxgenjs";
import { format, parseISO } from "date-fns";
import type { Brand, Publication } from "./types";
import { formatById, importanceById, platformById } from "./platforms";

export function exportPPTX(brand: Brand, pubs: Publication[], rangeLabel: string) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  // Title slide
  const title = pres.addSlide();
  title.background = { color: brand.color.replace("#", "") };
  title.addText(brand.name, {
    x: 0.6, y: 2.6, w: 12, h: 1.2,
    fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  title.addText(rangeLabel, {
    x: 0.6, y: 3.9, w: 12, h: 0.6,
    fontSize: 24, color: "FFFFFF", fontFace: "Calibri",
  });
  title.addText(`Exportado ${format(new Date(), "dd/MM/yyyy")}`, {
    x: 0.6, y: 6.5, w: 12, h: 0.4,
    fontSize: 12, color: "FFFFFFAA", fontFace: "Calibri",
  });

  // Group by day
  const grouped = new Map<string, Publication[]>();
  pubs
    .slice()
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
    .forEach((p) => {
      const key = p.publishDate.slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });

  for (const [dayKey, items] of grouped) {
    const slide = pres.addSlide();
    slide.background = { color: "F7F6F2" };

    // accent bar
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: brand.color.replace("#", "") },
    });

    slide.addText(format(parseISO(dayKey), "EEEE dd 'de' MMMM"), {
      x: 0.7, y: 0.4, w: 12, h: 0.7,
      fontSize: 32, bold: true, color: "28251D", fontFace: "Calibri",
    });
    slide.addText(brand.name, {
      x: 0.7, y: 1.05, w: 12, h: 0.4,
      fontSize: 14, color: "888888", fontFace: "Calibri",
    });

    let yPos = 1.7;
    const slotH = (7.0 - 1.7) / Math.max(items.length, 1);

    items.forEach((p) => {
      const imp = importanceById(p.importance);
      const fmt = formatById(p.format);

      // importance left border
      slide.addShape(pres.ShapeType.rect, {
        x: 0.7, y: yPos, w: 0.08, h: slotH - 0.15,
        fill: { color: imp.color.replace("#", "") },
      });

      // card bg
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.85, y: yPos, w: 11.6, h: slotH - 0.15,
        fill: { color: "FFFFFF" }, line: { color: "E5E2DA", width: 0.5 },
        rectRadius: 0.08,
      });

      slide.addText(
        `${fmt.icon}  ${fmt.label}  ·  ${p.objective === "paid" ? "Pagado" : "Orgánico"}  ·  ${p.platforms.map((id) => platformById(id).label).join(", ")}`,
        {
          x: 1.05, y: yPos + 0.1, w: 11.2, h: 0.35,
          fontSize: 13, bold: true, color: "28251D", fontFace: "Calibri",
        }
      );

      slide.addText(
        [
          { text: "Copy: ", options: { bold: true, color: "555555" } },
          { text: p.copy || "—", options: { color: "28251D" } },
        ],
        { x: 1.05, y: yPos + 0.5, w: 11.2, h: slotH - 0.85, fontSize: 11, fontFace: "Calibri", valign: "top" }
      );

      slide.addText(`Publica ${format(parseISO(p.publishDate), "HH:mm")}`, {
        x: 11.0, y: yPos + 0.1, w: 1.4, h: 0.3,
        fontSize: 10, color: "888888", align: "right", fontFace: "Calibri",
      });

      yPos += slotH;
    });
  }

  pres.writeFile({ fileName: `${brand.name}-${rangeLabel}.pptx` });
}
