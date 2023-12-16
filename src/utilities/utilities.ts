import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

import { 
  AppTagAvatar, 
  // DateSelectorType, 
  PhotosToDisplaySpec, 
  TagSelectorType
 } from '../types';
import { createAppTagAvatarDocument, createPhotosToDisplaySpecDocument } from "../controllers";

export const addAppAvatars = async (request: Request, response: Response, next: any) => {

  console.log('addAppAvatars');

  let appTagAvatar: AppTagAvatar;

  appTagAvatar = {
    id: uuidv4(),
    label: 'Person',
    pathToLarge: 'personLarge.png',
    path: 'person.png',
  };
  await addAppAvatar(appTagAvatar);

  appTagAvatar = {
    id: uuidv4(),
    label: 'Snoopy Walks Like An Egyption',
    pathToLarge: 'snoopyWalksLikeAnEgyptionLarge.png',
    path: 'snoopyWalksLikeAnEgyption.png',
  };
  await addAppAvatar(appTagAvatar);

  appTagAvatar = {
    id: uuidv4(),
    label: 'Snoopy Starry Night',
    pathToLarge: 'snoopyStarryNightLarge.png',
    path: 'snoopyStarryNight.png',
  };
  await addAppAvatar(appTagAvatar);

  appTagAvatar = {
    id: uuidv4(),
    label: 'Snoopy Biggest Hug Ever',
    pathToLarge: 'snoopyBiggestHugEverLarge.png',
    path: 'snoopyBiggestHugEver.png',
  };
  await addAppAvatar(appTagAvatar);

  appTagAvatar = {
    id: uuidv4(),
    label: 'Snoopy The Sailor',
    pathToLarge: 'snoopyTheSailorLarge.png',
    path: 'snoopyTheSailor.png',
  };
  await addAppAvatar(appTagAvatar);

  response.sendStatus(200);
}

const addAppAvatar = async (appTagAvatar: AppTagAvatar) => {
  await createAppTagAvatarDocument(appTagAvatar);
}

export const createPhotosToDisplaySpec = async (request: Request, response: Response, next: any) => {

  const photosToDisplaySpec: PhotosToDisplaySpec = {
    specifyDateRange: false,
    specifyTagExistence: false,
    specifyTags: false,
    // dateSelector: DateSelectorType.All,
    // tagSelector: TagSelectorType.Any,
    // startDate: new Date().toISOString(),
    // endDate: new Date().toISOString(),
  };

  // const photosToDisplaySpec = {
  //   dateSelector: DateSelectorType.All,
  //   tagSelector: TagSelectorType.Any,
  //   startDate: new Date('January 1, 2000 00:00:00').toISOString(),
  //   endDate: new Date('January 1, 2020 00:00:00').toISOString(),
  // };
  await createPhotosToDisplaySpecDocument(photosToDisplaySpec);

  response.sendStatus(200);

};

// export function convertStringToDateSelectorEnum(value: string): DateSelectorType | undefined {
//   const enumKeys = Object.keys(DateSelectorType) as (keyof typeof DateSelectorType)[];

//   for (const key of enumKeys) {
//     if (DateSelectorType[key] === value) {
//       return DateSelectorType[key];
//     }
//   }

//   return undefined;
// }

export function convertStringToTagSelectorEnum(value: string): TagSelectorType | undefined {
  const enumKeys = Object.keys(TagSelectorType) as (keyof typeof TagSelectorType)[];

  for (const key of enumKeys) {
    if (TagSelectorType[key] === value) {
      return TagSelectorType[key];
    }
  }

  return undefined;
}