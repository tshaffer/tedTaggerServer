import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

import { AppTagAvatar } from "entities";
import { createAppTagAvatarDocument } from "../controllers";

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
