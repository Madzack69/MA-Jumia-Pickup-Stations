import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin,
  Search,
  Filter,
  Phone,
  Clock,
  X,
  ExternalLink,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { fetchStations, type Provider } from "@/data/stations";
import { PickupMap } from "@/components/PickupMap";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Points Relais Maroc — Trouvez votre point de retrait" },
      {
        name: "description",
        content:
          "Localisez facilement les points de retrait Jumia, Barid Cash et Amana au Maroc. Filtrez par région, ville et station avec une carte interactive.",
      },
      { property: "og:title", content: "Points Relais Maroc" },
      {
        property: "og:description",
        content: "Carte interactive des points de retrait au Maroc.",
      },
    ],
  }),
  component: Home,
}));

const ANY = "__all__";

const PROVIDER_OPTIONS: { value: Provider; label: string; chip: string }[] = [
  { value: "jumia", label: "Jumia", chip: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  { value: "pickup", label: "Barid Cash", chip: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  { value: "amana", label: "Amana", chip: "bg-green-700/15 text-green-800 border-green-700/30" },
];

function providerChip(p: Provider) {
  return PROVIDER_OPTIONS.find((o) => o.value === p)?.chip ?? "";
}

function Home() {
  const {
    data: ALL_STATIONS = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["stations"],
    queryFn: fetchStations,
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  });

  // Pending (form) state
  const [provider, setProvider] = useState<string>(ANY);
  const [region, setRegion] = useState<string>(ANY);
  const [city, setCity] = useState<string>(ANY);
  const [stationId, setStationId] = useState<string>(ANY);
  const [query, setQuery] = useState("");
  // Applied state — only updates when the user submits
  const [applied, setApplied] = useState({
    provider: ANY,
    region: ANY,
    city: ANY,
    stationId: ANY,
    query: "",
  });
  const [activeId, setActiveId] = useState<string | undefined>();

  const baseByProvider = useMemo(
    () => ALL_STATIONS.filter((s) => provider === ANY || s.provider === provider),
    [ALL_STATIONS, provider],
  );

  const regions = useMemo(
    () => Array.from(new Set(baseByProvider.map((s) => s.region))).sort(),
    [baseByProvider],
  );
  const cities = useMemo(() => {
    const list = baseByProvider
      .filter((s) => region === ANY || s.region === region)
      .map((s) => s.city);
    return Array.from(new Set(list)).sort();
  }, [baseByProvider, region]);

  const stationOptions = useMemo(
    () =>
      baseByProvider.filter(
        (s) => (region === ANY || s.region === region) && (city === ANY || s.city === city),
      ),
    [baseByProvider, region, city],
  );

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    return ALL_STATIONS.filter((s) => {
      if (applied.provider !== ANY && s.provider !== applied.provider) return false;
      if (applied.region !== ANY && s.region !== applied.region) return false;
      if (applied.city !== ANY && s.city !== applied.city) return false;
      if (applied.stationId !== ANY && s.id !== applied.stationId) return false;
      if (q && !`${s.name} ${s.address} ${s.city} ${s.providerLabel}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [ALL_STATIONS, applied]);

  const submit = () => {
    setApplied({ provider, region, city, stationId, query });
    setActiveId(undefined);
  };

  const clear = () => {
    setProvider(ANY);
    setRegion(ANY);
    setCity(ANY);
    setStationId(ANY);
    setQuery("");
    setApplied({ provider: ANY, region: ANY, city: ANY, stationId: ANY, query: "" });
    setActiveId(undefined);
  };

  const isDirty =
    provider !== applied.provider ||
    region !== applied.region ||
    city !== applied.city ||
    stationId !== applied.stationId ||
    query !== applied.query;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Points Relais Maroc</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Trouvez le point de retrait le plus proche
              </p>
            </div>
          </div>
          {!isLoading && !isError && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {ALL_STATIONS.length} stations
            </Badge>
          )}
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm">Chargement des stations…</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-semibold">Impossible de charger les stations</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifiez votre connexion et réessayez.
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <Loader2 className="h-4 w-4" /> Réessayer
          </Button>
        </div>
      )}

      {/* Main content */}
      {!isLoading && !isError && (
        <>
          <section className="border-b border-border bg-gradient-to-br from-secondary via-background to-secondary">
            <div className="container mx-auto px-4 py-5 sm:py-8">
              <div className="max-w-4xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  Où souhaitez-vous récupérer votre commande&nbsp;?
                </h2>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Choisissez le transporteur, puis filtrez par région, ville ou station — ou cherchez directement.
                </p>
              </div>

              {/* Provider tabs */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setProvider(ANY);
                    setRegion(ANY);
                    setCity(ANY);
                    setStationId(ANY);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    provider === ANY
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-secondary"
                  }`}
                >
                  Tous ({ALL_STATIONS.length})
                </button>
                {PROVIDER_OPTIONS.map((o) => {
                  const count = ALL_STATIONS.filter((s) => s.provider === o.value).length;
                  const active = provider === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => {
                        setProvider(o.value);
                        setRegion(ANY);
                        setCity(ANY);
                        setStationId(ANY);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:bg-secondary"
                      }`}
                    >
                      {o.label} ({count})
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr]"
              >
                <Select
                  value={region}
                  onValueChange={(v) => {
                    setRegion(v);
                    setCity(ANY);
                    setStationId(ANY);
                  }}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Toutes les régions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={city}
                  onValueChange={(v) => {
                    setCity(v);
                    setStationId(ANY);
                  }}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Toutes les villes</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Toutes les stations</SelectItem>
                    {stationOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un point relais…"
                    className="pl-9 bg-card"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:col-span-2 lg:col-span-4">
                  <Button type="submit" className="gap-2 flex-1 sm:flex-none">
                    <Check className="h-4 w-4" /> Appliquer les filtres
                    {isDirty && (
                      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-primary-foreground/80" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4" /> Effacer
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-6 flex-1">
            <div className="grid gap-4 md:grid-cols-[320px_1fr] lg:grid-cols-[400px_1fr] md:h-[calc(100vh-280px)] md:min-h-[520px] lg:h-[calc(100vh-360px)] lg:min-h-[560px]">
              <div className="order-2 md:order-1 max-h-[55vh] md:max-h-none overflow-y-auto rounded-2xl border border-border bg-card p-2 space-y-2">
                {filtered.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-12 px-4">
                    Aucun point relais ne correspond à votre recherche.
                  </div>
                )}
                {filtered.map((s) => {
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      className={`w-full text-left rounded-xl p-3 transition-all border ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-transparent hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-lg grid place-items-center ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${providerChip(
                                s.provider,
                              )}`}
                            >
                              {s.providerLabel}
                            </span>
                          </div>
                          <div className="font-semibold truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.address}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {s.city}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {s.region}
                            </Badge>
                          </div>
                          {(s.hours || s.phone) && (
                            <div className="mt-2 space-y-0.5">
                              {s.hours && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{s.hours}</span>
                                </div>
                              )}
                              {s.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3 shrink-0" /> {s.phone}
                                </div>
                              )}
                            </div>
                          )}
                          {s.mapLink && (
                            <a
                              href={s.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="order-1 md:order-2 h-[50vh] sm:h-[55vh] md:h-auto min-h-[320px]">
                <PickupMap stations={filtered} activeId={activeId} onSelect={setActiveId} />
              </div>
            </div>
          </section>

          <footer className="border-t border-border mt-8">
            <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground text-center">
              Carte © OpenStreetMap contributors — Points Relais Maroc
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
