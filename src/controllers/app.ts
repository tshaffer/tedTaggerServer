import { Request, Response } from 'express';

import * as path from 'path';

const sharp = require('sharp');

import { version } from '../version';
import {
  createTagDocument,
  getAllTagsFromDb,
  assignTagAvatarToDbTag,
  addTagToDbMediaItems,
  replaceTagInDbMediaItems,
  getMediaItemsToDisplayFromDb,
  setDateSelectorDb,
  setTagSelectorDb,
  setStartDateDb,
  setEndDateDb,
  getPhotosToDisplaySpecFromDb,
  deleteTagFromDbMediaItems,
  getAllAppTagAvatarsFromDb,
  getAllUserTagAvatarsFromDb,
  createUserTagAvatarDocument,
  updateDbTagLabel
} from './dbInterface';
import { AppTagAvatar, MediaItem, Tag, UserTagAvatar } from '../types';
import multer from 'multer';
import { convertStringToDateSelectorEnum, convertStringToTagSelectorEnum } from '../utilities';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getMediaItemsToDisplay = async (request: Request, response: Response) => {
  const dateSelector = request.query.dateSelector as string;
  const tagSpec = request.query.tagSpec as string;
  const startDate = request.query.startDate as string;
  const endDate = request.query.endDate as string;
  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDb(
    convertStringToDateSelectorEnum(dateSelector), 
    convertStringToTagSelectorEnum(tagSpec),
     startDate, 
     endDate);
  response.json(mediaItems);
};

export const getTags = async (request: Request, response: Response, next: any) => {
  const tags: Tag[] = await getAllTagsFromDb();
  response.json(tags);
};

export const addTag = async (request: Request, response: Response, next: any) => {

  const { id, label, type, avatarType, avatarId } = request.body;

  let resolvedAvatarId = avatarId === '' ? '430b3cf0-33e7-4e72-a85b-c65e865ed66a' : avatarId;
  const tag: Tag = {
    id,
    label,
    type,
    avatarType,
    avatarId: resolvedAvatarId,
  };
  await createTagDocument(tag);

  response.sendStatus(200);
}

export const addTagToMediaItems = async (request: Request, response: Response, next: any) => {

  const { mediaItemIds, tagId } = request.body;

  await addTagToDbMediaItems(mediaItemIds, tagId);

  response.sendStatus(200);
}

export const replaceTagInMediaItems = async (request: Request, response: Response, next: any) => {

  const { mediaItemIds, existingTagId, newTagId  } = request.body;

  console.log('replaceTagInMediaItems');
  console.log(mediaItemIds);
  console.log('existingTagId: ', existingTagId); 
  console.log('newTagId: ', newTagId);

  await replaceTagInDbMediaItems(mediaItemIds, existingTagId, newTagId);

  response.sendStatus(200);
}



export const deleteTagFromMediaItems = async (request: Request, response: Response, next: any) => {

  const { tagId, mediaItemIds } = request.body;

  await deleteTagFromDbMediaItems(mediaItemIds, tagId);

  response.sendStatus(200);
}

export const uploadUserAvatarFile = async (request: Request, response: Response, next: any) => {

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/userAvatars');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage }).single('file');
  upload(request, response, function (err) {
    if (err instanceof multer.MulterError) {
      return response.status(500).json(err);
    } else if (err) {
      return response.status(500).json(err);
    }

    const inputFilePath: string = request.file!.path; // 'public/userAvatars/morgan.png'
    const avatarFileName = path.parse(inputFilePath).name + '.jpg';
    const outputFilePath: string = path.join(
      path.dirname(inputFilePath),
      avatarFileName);
    resizeAvatarFile(inputFilePath, outputFilePath);

    const responseData = {
      file: request.file,
      avatarFileName,
    };
    return response.status(200).send(responseData);
  });
};

const resizeAvatarFile = async (inputFilePath: string, outputFilePath: string) => {
  const sharpPromise: Promise<any> = sharp(inputFilePath)
    .resize(undefined, 50, { fit: 'contain' })
    .jpeg()
    .toFile(outputFilePath);
  sharpPromise
    .then((x: any) => {
      console.log(x);
    });
};

export const assignTagAvatarToTag = async (request: Request, response: Response, next: any) => {
  const { tagId, avatarType, avatarId } = request.body;
  await assignTagAvatarToDbTag(tagId, avatarType, avatarId);
  response.sendStatus(200);
}

export const updateTagLabel = async (request: Request, response: Response, next: any) => {
  const { tagId, tagLabel } = request.body;
  await updateDbTagLabel(tagId, tagLabel);
  response.sendStatus(200);
};

export const setDateSelector = async (request: Request, response: Response, next: any) => {
  console.log('setDateSelector');
  const { dateSelector } = request.body;
  setDateSelectorDb(dateSelector);
  response.sendStatus(200);
}

export const setTagSelector = async (request: Request, response: Response, next: any) => {
  console.log('setTagSelectorSpec');
  const { tagSelector } = request.body;
  setTagSelectorDb(tagSelector);
  response.sendStatus(200);
}

export const setStartDate = async (request: Request, response: Response, next: any) => {
  console.log('setStartDate');
  const { startDate } = request.body;
  setStartDateDb(startDate);
  response.sendStatus(200);
}

export const setEndDate = async (request: Request, response: Response, next: any) => {
  console.log('setEndDate');
  const { endDate } = request.body;
  setEndDateDb(endDate);
  response.sendStatus(200);
}

export const getPhotosToDisplaySpec = async (request: Request, response: Response, next: any) => {
  const photosToDisplaySpec = await getPhotosToDisplaySpecFromDb();
  response.json(photosToDisplaySpec);
};

export const getAppTagAvatars = async (request: Request, response: Response, next: any) => {
  const appTagAvatars: AppTagAvatar[] = await getAllAppTagAvatarsFromDb();
  response.json(appTagAvatars);
};

export const getUserTagAvatars = async (request: Request, response: Response, next: any) => {
  const userTagAvatars: UserTagAvatar[] = await getAllUserTagAvatarsFromDb();
  response.json(userTagAvatars);
};

export const addUserAvatar = async (request: Request, response: Response, next: any) => {
  const { id, label, path } = request.body;
  const userTagAvatar: UserTagAvatar = { id, label, path };
  const avatarId: string = await createUserTagAvatarDocument(userTagAvatar);
  response.json(avatarId);
}

