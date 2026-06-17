import { useState } from "react";
import { Download, FileText, Presentation } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  isWithinInterval,
} from "date-fns";
import type { Brand, Publication } from "@/lib/types";
import { exportPDF } from "@/lib/export-pdf";
import { exportPPTX } from "@/lib/export-pptx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ExportButton({ brand, publications }: { brand: Brand; publications: Publication[] }) {
  const [exporting, setExporting] = useState(false);

  const run = async (kind: "pdf" | "pptx", range: "day" | "week" | "month") => {
    setExporting(true);
    try {
      const now = new Date();
      let start: Date, end: Date, label: string;
      if (range === "day") {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
        label = format(now, "dd-MM-yyyy");
      } else if (range === "week") {
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        label = `Semana-${format(start, "dd-MM")}-${format(end, "dd-MM-yyyy")}`;
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
        label = format(now, "MMMM-yyyy");
      }
      const pubs = publications.filter((p) =>
        isWithinInterval(new Date(p.publishDate), { start, end })
      );
      if (kind === "pdf") exportPDF(brand, pubs, label);
      else exportPPTX(brand, pubs, label);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-brand text-white hover:opacity-90" disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileText className="w-4 h-4" /> PDF
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => run("pdf", "day")}>Por día</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("pdf", "week")}>Por semana</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("pdf", "month")}>Por mes</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Presentation className="w-4 h-4" /> PowerPoint
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => run("pptx", "day")}>Por día</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("pptx", "week")}>Por semana</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("pptx", "month")}>Por mes</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
