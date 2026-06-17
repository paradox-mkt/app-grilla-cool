import { useData } from "@/store/data";
import { useEffect } from "react";

/** Apply the brand color to a CSS variable scoped to the brand layout. */
export function useBrandAccent(brandId: string | undefined) {
  const brand = useData((s) => s.brands.find((b) => b.id === brandId));
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (brand) {
      root.style.setProperty("--brand", brand.color);
      root.style.setProperty(
        "--brand-soft",
        `color-mix(in oklab, ${brand.color} 14%, transparent)`
      );
    }
    return () => {
      // keep accent; don't reset on unmount so transitions feel stable
    };
  }, [brand]);
  return brand;
}
