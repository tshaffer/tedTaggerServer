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
  setTagSelectorDb,
  getPhotosToDisplaySpecFromDb,
  deleteTagFromDbMediaItems,
  getAllAppTagAvatarsFromDb,
  getAllUserTagAvatarsFromDb,
  createUserTagAvatarDocument,
  updateDbTagLabel,
  setDateRangeSpecificationDb,
  setTagExistenceSpecificationDb,
  deleteTagFromDb,
  getAllKeywordDataFromDb,
  createKeywordDocument,
  createKeywordNodeDocument,
  setRootKeywordNodeDb
} from './dbInterface';
import { AppTagAvatar, Keyword, KeywordData, KeywordNode, MediaItem, Tag, TagSearchOperator, TagSelectorType, UserTagAvatar } from '../types';
import multer from 'multer';
import {
  convertStringToTagSearchOperatorEnum,
  convertStringToTagSelectorEnum
} from '../utilities';

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

  const specifyTagsInSearch: boolean = JSON.parse(request.query.specifyTagsInSearch as string);
  const tagSelector: TagSelectorType = convertStringToTagSelectorEnum(request.query.tagSelector as string);
  const tagIds: string[] = (request.query.tagIds as string).split(',');
  const tagSearchOperator: TagSearchOperator = convertStringToTagSearchOperatorEnum(request.query.tagSearchOperator as string);

  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDb(
    specifyDateRange,
    startDate,
    endDate,
    specifyTagsInSearch,
    tagSelector,
    tagIds,
    tagSearchOperator,
  );
  response.json(mediaItems);
};

export const getMediaItemsToDisplayFromSearchSpec = async (request: Request, response: Response) => {
  console.log('getMediaItemsToDisplayFromSearchSpec');

  /*
    path += '?matchRule=' + matchRule;
    path += '&searchRules=' + JSON.stringify(searchRules);
  */

  const matchRule: string = request.query.matchRule as string;
  const searchRules: string = JSON.parse(request.query.searchRules as string);

  console.log('matchRule: ', matchRule);
  console.log('searchRules: ', searchRules);

  response.json([]);
};

export const getTags = async (request: Request, response: Response, next: any) => {
  const tags: Tag[] = await getAllTagsFromDb();
  response.json(tags);
};

export const addTag = async (request: Request, response: Response, next: any) => {

  const { id, label, type, avatarType, avatarId } = request.body;

  // TEDTODO
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

export const deleteTag = async (request: Request, response: Response, next: any) => {
  const { tagId } = request.body;
  await deleteTagFromDb(tagId);
  response.sendStatus(200);
}

export const addTagToMediaItems = async (request: Request, response: Response, next: any) => {

  const { mediaItemIds, tagId } = request.body;

  await addTagToDbMediaItems(mediaItemIds, tagId);

  response.sendStatus(200);
}

export const replaceTagInMediaItems = async (request: Request, response: Response, next: any) => {

  const { mediaItemIds, existingTagId, newTagId } = request.body;

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

export const setDateRangeSpecification = async (request: Request, response: Response, next: any) => {
  const { specifyDateRange, startDate, endDate } = request.body;
  setDateRangeSpecificationDb(specifyDateRange, startDate, endDate);
  response.sendStatus(200);
}

export const setTagExistenceSpecification = async (request: Request, response: Response, next: any) => {
  const { specifyTagExistence, tagSelector } = request.body;
  setTagExistenceSpecificationDb(specifyTagExistence, tagSelector);
  response.sendStatus(200);
}

export const setTagsSpecification = async (request: Request, response: Response, next: any) => {
  console.log('setDateSelector');
  const { dateSelector } = request.body;
  // setDateSelectorDb(dateSelector);
  response.sendStatus(200);
}

// export const setDateSelector = async (request: Request, response: Response, next: any) => {
//   console.log('setDateSelector');
//   const { dateSelector } = request.body;
//   setDateSelectorDb(dateSelector);
//   response.sendStatus(200);
// }

export const setTagSelector = async (request: Request, response: Response, next: any) => {
  console.log('setTagSelectorSpec');
  const { tagSelector } = request.body;
  setTagSelectorDb(tagSelector);
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

export const getDefaultAvatarId = async (request: Request, response: Response, next: any) => {
  const defaultAvatarId: string = '430b3cf0-33e7-4e72-a85b-c65e865ed66a';
  response.json(defaultAvatarId);
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

/*
export const getVersion = (request: Request, response: Response, next: any) => {
  console.log('getVersion');
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

*/
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

export const setRootKeywordNode = async (request: Request, response: Response, next: any) => {
  const { rootNodeId } = request.body;
  await setRootKeywordNodeDb(rootNodeId);
  return response.status(200).send();
}

