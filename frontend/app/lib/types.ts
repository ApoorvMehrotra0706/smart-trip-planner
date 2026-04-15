export interface Place {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
  days?: number;      // per-city duration (set when added to trip, default 3)
  styles?: string[];  // per-city travel styles (default ["relaxed"])
  hotel?: string;     // accommodation address / hotel name
}

export interface Trip {
  id: string;
  name: string;
  places: Place[];
  days: number;
  style: string;
  itinerary: ItineraryDay[] | null;
  createdAt: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}
