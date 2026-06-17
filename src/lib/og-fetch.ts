export interface OGData {
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  isFavicon?: boolean;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function parseOGFromHTML(html: string, url: string): OGData {
  const domain = domainOf(url);
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const getMeta = (prop: string) =>
      doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") ||
      doc.querySelector(`meta[name="${prop}"]`)?.getAttribute("content") ||
      "";
    const title =
      getMeta("og:title") || getMeta("twitter:title") || doc.title || domain;
    const description =
      getMeta("og:description") ||
      getMeta("twitter:description") ||
      getMeta("description") ||
      "";
    const image = getMeta("og:image") || getMeta("twitter:image") || "";
    return { title, description, image, domain };
  } catch {
    return { title: domain, domain };
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

export async function fetchOG(url: string): Promise<OGData> {
  const domain = domainOf(url);

  // Strategy 1: allorigins proxy
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await withTimeout(fetch(proxy), 8000);
    const json = await res.json();
    const html: string = json.contents || "";
    if (html) {
      const og = parseOGFromHTML(html, url);
      if (og.title || og.image) return og;
    }
  } catch {}

  // Strategy 2: microlink
  try {
    const microlink = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const res = await withTimeout(fetch(microlink), 8000);
    const json = await res.json();
    if (json.status === "success" && json.data) {
      return {
        title: json.data.title || domain,
        description: json.data.description || "",
        image: json.data.image?.url || json.data.screenshot?.url || "",
        domain,
      };
    }
  } catch {}

  // Strategy 3: favicon fallback
  return {
    title: domain,
    description: url,
    image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    domain,
    isFavicon: true,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
