import { NextResponse } from "next/server";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const baseUrl = process.env.NOMINATIM_SEARCH_URL ?? "https://nominatim.openstreetmap.org/search";
  const url = new URL(baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", process.env.NOMINATIM_COUNTRYCODES ?? "ph");

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "Kalakbay/0.1 route-search"
    },
    next: { revalidate: 86400 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Address search is unavailable right now." }, { status: 502 });
  }

  const rows = (await response.json()) as NominatimResult[];
  const results = rows.map((item) => ({
    id: String(item.place_id),
    label: item.display_name,
    name: item.name || item.display_name.split(",")[0],
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    type: item.type ?? "place"
  }));

  return NextResponse.json({ results });
}
