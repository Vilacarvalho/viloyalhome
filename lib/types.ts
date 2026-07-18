export type Coords = {
  lat: number;
  lon: number;
  /** Accuracy radius in meters, when known (device GPS). */
  accuracy?: number;
  /** Where the coordinate came from. */
  source: "device" | "exif";
};

export type Address = {
  label: string;
  road?: string;
  houseNumber?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export type Scan = {
  id: string;
  createdAt: string;
  photoDataUrl: string;
  coords: Coords | null;
  address: Address | null;
  notes?: string;
};
