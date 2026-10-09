import { MapPin, Navigation, PhoneCall, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/States";
import { Page } from "@/components/common/Page";
import { SectionHeader } from "@/components/common/Premium";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/useLanguage";

type Facility = {
  id: number;
  name: string;
  kind: string;
  phone?: string;
  address?: string;
  lat: number;
  lon: number;
  distanceKm?: number;
};

type GeoPoint = { lat: number; lon: number; label: string };

function distanceKm(a: GeoPoint, lat: number, lon: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat - a.lat);
  const dLon = toRad(lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** HerReach: real health-facility lookup via OpenStreetMap (Nominatim + Overpass). */
export function HerReachPage() {
  const { t } = useLanguage();
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline] = useState(() => (typeof navigator !== "undefined" ? !navigator.onLine : false));

  const searchFrom = useCallback(async (point: GeoPoint) => {
    setLoading(true);
    setError("");
    setOrigin(point);
    try {
      const query = `[out:json][timeout:25];(
node["amenity"~"hospital|clinic|doctors|pharmacy"](around:20000,${point.lat},${point.lon});
way["amenity"~"hospital|clinic|doctors|pharmacy"](around:20000,${point.lat},${point.lon});
);out center 50;`;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) throw new Error(`Overpass responded ${response.status}`);
      const payload = (await response.json()) as {
        elements: Array<{
          id: number;
          type: string;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };

      const seen = new Set<string>();
      const mapped: Facility[] = [];
      const facilityLabels: Record<string, string> = {
        hospital: t.herreach.facilityTypes.hospital,
        clinic: t.herreach.facilityTypes.clinic,
        doctors: t.herreach.facilityTypes.doctor,
        pharmacy: t.herreach.facilityTypes.pharmacy,
      };
      for (const element of payload.elements) {
        const tags = element.tags ?? {};
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;
        if (!lat || !lon || !tags.amenity) continue;
        const name = tags.name;
        if (!name) continue;
        const key = `${name}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        mapped.push({
          id: element.id,
          name,
          kind: facilityLabels[tags.amenity] ?? tags.amenity,
          phone: tags.phone || tags["contact:phone"] || undefined,
          address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:postcode"]]
            .filter(Boolean)
            .join(" ") || undefined,
          lat,
          lon,
          distanceKm: distanceKm(point, lat, lon),
        });
      }
      mapped.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      setFacilities(mapped);
      if (!mapped.length) setFacilities([]);
    } catch {
      setFacilities([]);
      setError(t.herreach.error);
    } finally {
      setLoading(false);
    }
  }, [t.herreach.error, t.herreach.facilityTypes]);

  const locate = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation unavailable"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 });
      });
      setLoading(false);
      await searchFrom({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        label: t.herreach.currentLocation,
      });
      return;
    } catch {
      // Fall back to the district/village recorded on the mother's profile.
    }

    try {
      const profile = await api.profile();
      const place = [profile.village, profile.district, "India"].filter(Boolean).join(", ");
      if (!profile.village && !profile.district) {
        setLoading(false);
        setFacilities([]);
        setError(t.herreach.empty);
        return;
      }
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`,
      );
      if (!geoResponse.ok) throw new Error(`Geocoder responded ${geoResponse.status}`);
      const geo = (await geoResponse.json()) as Array<{ lat: string; lon: string }>;
      if (!geo.length) {
        setLoading(false);
        setFacilities([]);
        setError(t.herreach.empty);
        return;
      }
      setLoading(false);
      await searchFrom({ lat: Number(geo[0].lat), lon: Number(geo[0].lon), label: place });
    } catch {
      setLoading(false);
      setFacilities([]);
      setError(t.herreach.error);
    }
  }, [searchFrom, t.herreach.currentLocation, t.herreach.empty, t.herreach.error]);

  useEffect(() => {
    if (!offline) void locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title={t.herreach.title} subtitle={t.herreach.subtitle}>
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionHeader
              title={t.herreach.facilityTitle}
              subtitle={
                origin
                  ? `${t.herreach.searchedWithin} ${origin.label}`
                  : t.herreach.locationHint
              }
            />
          </div>
          <Button onClick={() => void locate()} disabled={loading || offline}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t.herreach.searching : t.herreach.locateBtn}
          </Button>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-xl bg-lavender-50 p-3 text-[11px] leading-5 text-muted dark:bg-white/5 dark:text-white/60">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {t.herreach.disclaimer}
        </p>

        {offline ? (
          <div className="mt-4">
            <EmptyState title={t.herreach.offlineTitle} text={t.herreach.offline} />
          </div>
        ) : loading ? (
          <div className="mt-4">
            <LoadingSkeleton />
          </div>
        ) : error && (!facilities || facilities.length === 0) ? (
          <div className="mt-4">
            <ErrorState />
            <p className="mt-2 text-center text-xs text-muted">{error}</p>
          </div>
        ) : !facilities || facilities.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t.herreach.noFacilitiesTitle} text={t.herreach.empty} />
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {facilities.map((facility) => (
              <li
                key={facility.id}
                className="rounded-2xl border border-lavender-100 bg-white/90 p-4 transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink dark:text-white">{facility.name}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                      {facility.kind}
                      {typeof facility.distanceKm === "number" ? ` · ${facility.distanceKm} km` : ""}
                    </p>
                    {facility.address ? (
                      <p className="mt-1 flex items-start gap-1 text-xs text-muted">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {facility.address}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {facility.phone ? (
                    <a
                      href={`tel:${facility.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-black text-white shadow-soft hover:opacity-90"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> {t.herreach.call}
                    </a>
                  ) : null}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${facility.lat}&mlon=${facility.lon}#map=17/${facility.lat}/${facility.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-lavender-200 px-3 py-1.5 text-[11px] font-black text-ink hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
                  >
                    <Navigation className="h-3.5 w-3.5" /> {t.herreach.openMap}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
