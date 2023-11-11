import { Request, Response } from 'express';

import * as path from 'path';

const sharp = require('sharp');

import { version } from '../version';
import {
  createTagDocument,
  getAllMediaItemsFromDb,
  getAllTagsFromDb,
  addTagToDbMediaItem,
  assignTagIconToDbTag,
  addTagToDbMediaItems,
  getMediaItemsToDisplayFromDb,
} from './dbInterface';
import { MediaItem, Tag, ViewSpecType } from '../types';
import multer from 'multer';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getMediaItems = async (request: Request, response: Response, next: any) => {
  console.log('getMediaItems');
  const mediaItems: MediaItem[] = await getAllMediaItemsFromDb();
  response.json(mediaItems);
};

export const getMediaItemsToDisplay = async (request: Request, response: Response) => {
  const viewSpec = request.query.viewSpec as string;
  const startDate = request.query.startDate as string;
  const endDate = request.query.endDate as string;
  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDb(viewSpec, startDate, endDate);
  response.json(mediaItems);
};

export const getTags = async (request: Request, response: Response, next: any) => {
  console.log('getTags');
  const tags: Tag[] = await getAllTagsFromDb();
  response.json(tags);
};

export const addTag = async (request: Request, response: Response, next: any) => {

  console.log('addTag');
  console.log(request.body);

  const { id, label, type } = request.body;

  const tag: Tag = {
    id,
    label,
    type,
  };
  await createTagDocument(tag);

  response.sendStatus(200);
}

export const addTagToMediaItem = async (request: Request, response: Response, next: any) => {

  console.log('addTagToMediaItem');
  console.log(request.body);

  const { mediaItemId, tagId } = request.body;

  await addTagToDbMediaItem(mediaItemId, tagId);

  response.sendStatus(200);
}

export const addTagToMediaItems = async (request: Request, response: Response, next: any) => {

  console.log('addTagToMediaItems');
  console.log(request.body);

  const { mediaItemIds, tagId } = request.body;

  await addTagToDbMediaItems(mediaItemIds, tagId);

  response.sendStatus(200);
}

export const uploadTagIconFile = async (request: Request, response: Response, next: any) => {

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/tagIconImages');
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
    console.log('return from upload: ', request.file);

    const inputFilePath: string = request.file!.path; // 'public/tagIconImages/morgan.png'
    console.log(path.basename(inputFilePath)); // morgan.png
    console.log(path.dirname(inputFilePath));  // public/tagIconImages
    console.log(path.extname(inputFilePath));  // .png
    console.log(path.parse(inputFilePath));  // base, dir, ext as above. name: 'morgan'
    const iconFileName = path.parse(inputFilePath).name + '.jpg';
    const outputFilePath: string = path.join(
      path.dirname(inputFilePath),
      iconFileName);
    console.log(outputFilePath);
    resizeIconFile(inputFilePath, outputFilePath);

    const responseData = {
      file: request.file,
      iconFileName,
    };
    return response.status(200).send(responseData);
  });
};

const resizeIconFile = async (inputFilePath: string, outputFilePath: string) => {
  const sharpPromise: Promise<any> = sharp(inputFilePath)
    .resize(undefined, 50, { fit: 'contain' })
    .jpeg()
    .toFile(outputFilePath);
  sharpPromise
    .then((x: any) => {
      console.log(x);
    });
};

export const assignTagIconToTag = async (request: Request, response: Response, next: any) => {

  console.log('assignTagIconToTag');

  const { tagId, iconFileName } = request.body;

  console.log(tagId, iconFileName);

  await assignTagIconToDbTag(tagId, iconFileName);

  response.sendStatus(200);
}

export const setViewSpecType = async (request: Request, response: Response, next: any) => {

  console.log('setViewSpecType');

  // const { tagId, iconFileName } = request.body;

  // console.log(tagId, iconFileName);

  // await assignTagIconToDbTag(tagId, iconFileName);

  response.sendStatus(200);
}

export const setStartDate = async (request: Request, response: Response, next: any) => {

  console.log('setStartDate');

  // const { tagId, iconFileName } = request.body;

  // console.log(tagId, iconFileName);

  // await assignTagIconToDbTag(tagId, iconFileName);

  response.sendStatus(200);
}

export const setEndDate = async (request: Request, response: Response, next: any) => {

  console.log('setEndDate');

  // const { tagId, iconFileName } = request.body;

  // console.log(tagId, iconFileName);

  // await assignTagIconToDbTag(tagId, iconFileName);

  response.sendStatus(200);
}