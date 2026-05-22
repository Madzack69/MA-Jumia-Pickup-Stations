export type Provider = "jumia" | "pickup" | "amana";

export type Station = {
  id: string;
  provider: Provider;
  providerLabel: string;
  name: string;
  region: string;
  city: string;
  address: string;
  phone?: string;
  hours?: string;
  mapLink?: string;
  lat: number;
  lng: number;
};

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwP46wYvZ1y2n8ylAHHQonM0DvZ1ah4UQljeXfjQGLSntW5yjV6fzLDdEOYzINIBTuV_w/exec";

function deriveProviderLabel(provider: string): string {
  if (provider === "jumia") return "Jumia";
  if (provider === "pickup") return "Barid Cash";
  if (provider === "amana") return "Amana";
  return provider;
}

export async function fetchStations(): Promise<Station[]> {
  const res = await fetch(GAS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: Record<string, unknown>[] = await res.json();
  return raw.map((r) => ({
    id: String(r.id ?? ""),
    provider: (r.provider as Provider) ?? "jumia",
    providerLabel:
      typeof r.providerLabel === "string" && r.providerLabel
        ? r.providerLabel
        : deriveProviderLabel(String(r.provider ?? "")),
    name: String(r.name ?? ""),
    region: String(r.region ?? ""),
    city: String(r.city ?? ""),
    address: String(r.address ?? ""),
    phone: r.phone ? String(r.phone) : undefined,
    hours: r.hours ? String(r.hours) : undefined,
    mapLink: r.mapLink ? String(r.mapLink) : undefined,
    lat: Number(r.lat),
    lng: Number(r.lng),
  }));
}
