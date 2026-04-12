export interface Place {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (!query.trim()) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "SmartTripPlanner/1.0" },
  });

  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();

  return data.map((item: Record<string, unknown>) => ({
    id: String(item.place_id),
    name: String(item.name || (item.display_name as string).split(",")[0]),
    displayName: String(item.display_name),
    lat: parseFloat(String(item.lat)),
    lon: parseFloat(String(item.lon)),
    type: String(item.type),
    importance: Number(item.importance),
  }));
}
