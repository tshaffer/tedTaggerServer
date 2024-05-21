import { Request, Response } from 'express';

import * as path from 'path';

const sharp = require('sharp');

import { version } from '../version';
import {
  getMediaItemsToDisplayFromDb,
  getPhotosToDisplaySpecFromDb,
  setDateRangeSpecificationDb,
  getAllKeywordDataFromDb,
  createKeywordDocument,
  createKeywordNodeDocument,
  setRootKeywordNodeDb,
  getMediaItemsToDisplayFromDbUsingSearchSpec,
  createTakeoutDocument,
  getTakeoutsFromDb,
  getTakeoutById,
  updateKeywordNodeDb,
  deleteMediaItemsFromDb,
  getMediaItemFromDb,
  addMediaItemToDeletedMediaItemsDBTable,
  getDeletedMediaItemsFromDb,
  removeDeleteMediaItemFromDb,
  clearDeletedMediaItemsDb
} from './dbInterface';
import { Keyword, KeywordData, KeywordNode, MediaItem, SearchRule, SearchSpec, Takeout, AddedTakeoutData } from '../types';
import multer from 'multer';
import {
  fsDeleteFiles
} from '../utilities';
import { MatchRule } from 'enums';
import { importFromTakeout, redownloadGooglePhoto } from './takeouts';

export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getMediaItemsToDisplay = async (request: Request, response: Response) => {
  console.log('getMediaItemsToDisplay');

  const specifyDateRange: boolean = JSON.parse(request.query.specifyDateRange as string);
  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDb(
    specifyDateRange,
    startDate,
    endDate,
  );
  response.json(mediaItems);
};

export const getMediaItemsToDisplayFromSearchSpec = async (request: Request, response: Response) => {
  console.log('getMediaItemsToDisplayFromSearchSpec');

  /*
    path += '?matchRule=' + matchRule;
    path += '&searchRules=' + JSON.stringify(searchRules);
  */

  const matchRule: MatchRule = request.query.matchRule as MatchRule;
  const searchRules: SearchRule[] = JSON.parse(request.query.searchRules as string) as SearchRule[];

  const searchSpec: SearchSpec = {
    matchRule,
    searchRules,
  };

  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDbUsingSearchSpec(searchSpec);
  response.json(mediaItems);
};

export const setDateRangeSpecification = async (request: Request, response: Response, next: any) => {
  const { specifyDateRange, startDate, endDate } = request.body;
  setDateRangeSpecificationDb(specifyDateRange, startDate, endDate);
  response.sendStatus(200);
}

export const setStartDate = async (request: Request, response: Response, next: any) => {
  console.log('setStartDate');
  const { startDate } = request.body;
  // setStartDateDb(startDate);
  response.sendStatus(200);
}

export const setEndDate = async (request: Request, response: Response, next: any) => {
  console.log('setEndDate');
  const { endDate } = request.body;
  // setEndDateDb(endDate);
  response.sendStatus(200);
}

export const getPhotosToDisplaySpec = async (request: Request, response: Response, next: any) => {
  const photosToDisplaySpec = await getPhotosToDisplaySpecFromDb();
  response.json(photosToDisplaySpec);
};

export const getAllKeywordData = async (request: Request, response: Response, next: any) => {
  console.log('getAllKeywordData');
  const keywordData: KeywordData = await getAllKeywordDataFromDb();
  response.json(keywordData);
};

export const addKeyword = async (request: Request, response: Response, next: any) => {
  const { keywordId, label, type } = request.body;
  const keyword: Keyword = { keywordId, label, type };
  const keywordIdFromDb: string = await createKeywordDocument(keyword);
  response.json(keywordIdFromDb);
}

export const addKeywordNode = async (request: Request, response: Response, next: any) => {
  const { nodeId, keywordId, parentNodeId, childrenNodeIds } = request.body;
  const keywordNode: KeywordNode = { nodeId, keywordId, parentNodeId, childrenNodeIds };
  const keywordNodeIdFromDb: string = await createKeywordNodeDocument(keywordNode);
  response.json(keywordNodeIdFromDb);
}

export const updateKeywordNode = async (request: Request, response: Response, next: any) => {
  const { nodeId, keywordId, parentNodeId, childrenNodeIds } = request.body;
  const keywordNode: KeywordNode = { nodeId, keywordId, parentNodeId, childrenNodeIds };
  await updateKeywordNodeDb(keywordNode);
  response.json(keywordNode);
}

export const initializeKeywordTree = async (request: Request, response: Response, next: any) => {

  const rootKeyword: Keyword = {
    keywordId: 'rootKeywordId',
    label: 'All',
    type: 'tbd'
  };
  const rootKeywordId: string = await createKeywordDocument(rootKeyword);

  const rootKeywordNode: KeywordNode = {
    nodeId: 'rootKeywordNodeId',
    keywordId: rootKeywordId,
    parentNodeId: '',
    childrenNodeIds: []
  };
  const rootKeywordNodeIdFromDb: string = await createKeywordNodeDocument(rootKeywordNode);

  const peopleKeyword: Keyword = {
    keywordId: 'peopleKeywordId',
    label: 'People',
    type: 'tbd'
  };
  const peopleKeywordId: string = await createKeywordDocument(peopleKeyword);

  const peopleKeywordNode: KeywordNode = {
    nodeId: 'peopleKeywordNodeId',
    keywordId: peopleKeywordId,
    parentNodeId: rootKeywordNode.nodeId,
    childrenNodeIds: []
  };
  const peopleKeywordNodeIdFromDb: string = await createKeywordNodeDocument(peopleKeywordNode);

  rootKeywordNode.childrenNodeIds.push(peopleKeywordNode.nodeId);
  await updateKeywordNodeDb(rootKeywordNode);

  return response.status(200).send();
}

export const setRootKeywordNode = async (request: Request, response: Response, next: any) => {
  const { rootNodeId } = request.body;
  await setRootKeywordNodeDb(rootNodeId);
  return response.status(200).send();
}

export const getTakeouts = async (request: Request, response: Response, next: any) => {
  console.log('getTakeouts');
  const takeouts: any = await getTakeoutsFromDb();
  response.json(takeouts);
};

export const addTakeout = async (request: Request, response: Response, next: any) => {
  const { id, label, albumName, path } = request.body;
  const takeoutIdFromDb: string = await createTakeoutDocument({ id, label, albumName, path });
  response.json(takeoutIdFromDb);
}

export const importFromTakeoutEndpoint = async (request: Request, response: Response, next: any) => {
  const { id } = request.body;
  const takeout: Takeout = await getTakeoutById(id);
  const addedTakeoutData: AddedTakeoutData = await importFromTakeout(takeout.albumName, takeout.path);
  response.json(addedTakeoutData);
}

export const deleteMediaItems = async (request: Request, response: Response, next: any) => {
  
  const { mediaItemIds } = request.body;

  const filePaths: string[] = await Promise.all(mediaItemIds.map(async (iterator: string) => {
    const mediaItem: MediaItem = await getMediaItemFromDb(iterator);
    await addMediaItemToDeletedMediaItemsDBTable(mediaItem);
    return mediaItem.filePath;
  }));

  await deleteMediaItemsFromDb(mediaItemIds);
  await fsDeleteFiles(filePaths);
  
  response.sendStatus(200);
}

export const getDeletedMediaItems = async (request: Request, response: Response, next: any) => {
  console.log('getDeletedMediaItems');
  const deletedMediaItems: any = await getDeletedMediaItemsFromDb();
  response.json(deletedMediaItems);
};

export const clearDeletedMediaItems = async (request: Request, response: Response, next: any) => {
  console.log('clearDeletedMediaItems');
  await clearDeletedMediaItemsDb();
  response.sendStatus(200);
}

export const removeDeletedMediaItem = async (request: Request, response: Response, next: any) => {
  const { mediaItemId } = request.body;
  await removeDeleteMediaItemFromDb(mediaItemId);
  response.sendStatus(200);
}

export const redownloadMediaItemEndpoint = async (request: Request, response: Response, next: any) => {
  const { id } = request.body;
  const mediaItem: MediaItem = await getMediaItemFromDb(id);
  await redownloadGooglePhoto(mediaItem);
  response.sendStatus(200);
}

