export interface GeoData {
  latitude: number;
  longitude: number;
  altitude: number;
  latitudeSpan: number;
  longitudeSpan: number;
}

export interface MediaItem {
  googleId: string,
  fileName: string,
  albumId: string;
  filePath?: string,
  productUrl?: string,
  baseUrl?: string,
  mimeType?: string,
  creationTime?: string,
  width?: number,
  height?: number
  orientation?: number,
  description?: string,
  geoData?: GeoData,
  people?: string[],
  tagIds: string[],
}

export interface Tag {
  id: string;
  label: string;
  type: string,
  iconFileName?: string;
}

export enum ViewSpecType {
  All,
  ByDateRange,
}

export enum ViewSpecTagType {
  Any = 'any',
  Untagged = 'untagged',
}

export interface ViewSpec {
  viewSpecType: ViewSpecType;
  tagSpec: ViewSpecTagType;
  startDate: string;
  endDate: string;
}

export interface ViewSpecDb {
  type: number;
  tagSpec: string;
  startDate: string;
  endDate: string;

}
