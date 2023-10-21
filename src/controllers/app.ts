import { Request, Response } from 'express';

import { version } from '../version';
import {
  createTagDocument,
  getAllMediaItemsFromDb,
  getAllTagsFromDb,
} from './dbInterface';
import { MediaItem, Tag } from '../types';

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

export const getTags = async (request: Request, response: Response, next: any) => {
  console.log('getTags');
  const tags: Tag[] = await getAllTagsFromDb();
  response.json(tags);
};

export const addTag = async (request: Request, response: Response, next: any) => {

  console.log('addTag');
  console.log(request.body);

  const { id, label } = request.body;

  const tag: Tag = {
    id,
    label,
  };
  await createTagDocument(tag);

  response.sendStatus(200);
}

