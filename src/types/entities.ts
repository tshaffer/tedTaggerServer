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
  type: string;
  avatarType: string;
  avatarId: string;
}

// export enum DateSelectorType {
//   All = 'all',
//   ByDateRange = 'byDateRange',
// }

export enum TagSelectorType {
  Untagged = 'untagged',
  Tagged = 'tagged',
  TagList = 'tagList',
}

export enum TagSearchOperator {
  AND = 'AND',
  OR = 'OR',
}

export interface PhotosToDisplaySpec {
  // dateSelector: DateSelectorType;
  // tagSelector: TagSelectorType;
  // startDate: string;
  // endDate: string;
  specifyDateRange: boolean;
  startDate?: string;
  endDate?: string;
  specifyTagExistence: boolean;
  tagSelector?: TagSelectorType;
  specifySearchWithTags: boolean;
  tagIds: string[];
}

export interface DateRangeSpecification {
  specifyDateRange: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TagExistenceSpecification {
  specifyTagExistence: boolean;
  tagSelector?: TagSelectorType;
}

export interface AppTagAvatar {
  id: string;
  label: string;
  pathToLarge: string;
  path: string;
}

export interface UserTagAvatar {
  id: string;
  label: string;
  path: string;
}

export interface Keyword {
  keywordId: string;
  label: string;
  type: string;
}

export interface KeywordNode {
  nodeId: string;
  keywordId: string;
  parentNodeId?: string;
  childrenNodeIds?: string[];
}

export interface KeywordData {
  keywords: Keyword[];
  keywordNodes: KeywordNode[];
  keywordRootNodeId: string;
}