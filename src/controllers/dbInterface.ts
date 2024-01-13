import { isArray, isNil, isString } from 'lodash';
import {
  getAppTagAvatarModel,
  getKeywordModel,
  getKeywordNodeModel,
  getKeywordTreeModel,
  getMediaitemModel,
  getTagModel,
  getUserTagAvatarModel,
} from '../models';
import {
  AppTagAvatar,
  MediaItem,
  Tag,
  UserTagAvatar,
  PhotosToDisplaySpec,
  TagSelectorType,
  TagSearchOperator,
  Keyword,
  KeywordNode,
} from '../types';
import { Document } from 'mongoose';
import { getPhotosToDisplaySpecModel } from '../models/PhotosToDisplaySpec';

export const getAllMediaItemsFromDb = async (): Promise<MediaItem[]> => {

  const mediaItemModel = getMediaitemModel();

  const mediaItems: MediaItem[] = [];
  const documents: any = await (mediaItemModel as any).find().exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const getMediaItemsToDisplayFromDb = async (
  specifyDateRange: boolean,
  startDate: string | null,
  endDate: string | null,
  specifyTagsInSearch: boolean,
  tagSelector: TagSelectorType | null,
  tagIds: string[] = [],
  tagSearchOperator: TagSearchOperator | null,
): Promise<MediaItem[]> => {

  let querySpec = {};

  if (specifyDateRange) {
    querySpec = { creationTime: { $gte: startDate, $lte: endDate } };
  }
  if (specifyTagsInSearch) {
    switch (tagSelector) {
      case TagSelectorType.Untagged:
        querySpec = { ...querySpec, tagIds: { $size: 0 } };
        break;
      case TagSelectorType.Tagged:
        querySpec = { ...querySpec, tagIds: { $size: { $gt: 0 } } };
        break;
      case TagSelectorType.TagList: {
        if (tagIds.length > 0) {
          const tagSearchOperatorValue: string = isNil(tagSearchOperator) ? TagSearchOperator.OR : tagSearchOperator;
          if (tagSearchOperatorValue === TagSearchOperator.AND) {
            querySpec = { ...querySpec, tagIds: { $all: tagIds } };
          } else {
            querySpec = { ...querySpec, tagIds: { $in: tagIds } };
          }
        }
        break;
      }
      default:
        break;
    }
  }

  console.log('getMediaItemsToDisplayFromDb querySpec: ', querySpec);

  const mediaItemModel = getMediaitemModel();

  const query = mediaItemModel.find(querySpec);
  const documents: any = await query.exec();
  const mediaItems: MediaItem[] = [];
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const getAllTagsFromDb = async (): Promise<Tag[]> => {

  const tagModel = getTagModel();

  const tags: Tag[] = [];
  const documents: any = await (tagModel as any).find().exec();
  for (const document of documents) {
    const tag: Tag = document.toObject() as Tag;
    tag.id = document.id.toString();
    tag.label = document.label.toString();
    tags.push(tag);
  }
  return tags;
}

export const createTagDocument = async (tag: Tag): Promise<Document | void> => {

  const tagModel = getTagModel();

  return tagModel.create(tag)
    .then((tagDocument: any) => {
      return Promise.resolve(tagDocument);
    }).catch((err: any) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        console.log('Duplicate key error in createTagDocument: ', tag);
      }
      // return Promise.reject(err);
      return Promise.resolve();
    });
};

export const deleteTagFromDb = async (tagId: string): Promise<any> => {
  const tagModel = getTagModel();
  const filter = { id: tagId };
  await tagModel.deleteOne(filter);
}


// https://stackoverflow.com/questions/33049707/push-items-into-mongo-array-via-mongoose
export const addTagToDbMediaItem = async (mediaItemId: string, tagId: string): Promise<any> => {

  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItemId };

  const mediaItemDocument: Document = await mediaItemModel.findOne(filter);
  mediaItemDocument.get('tagIds').push(tagId);
  mediaItemDocument.markModified('tagIds');
  return await mediaItemDocument.save();
}

export const addTagToDbMediaItems = async (mediaItemIds: string[], tagId: string): Promise<any> => {

  // better db interface to do the this??

  const promises: Promise<any>[] = [];
  mediaItemIds.forEach((mediaItemId: string) => {
    promises.push(addTagToDbMediaItem(mediaItemId, tagId));
  });
  return Promise.all(promises)
    .then(() => {
      return Promise.resolve();
    })
}

export const replaceTagInDbMediaItem = async (mediaItemId: string, existingTagId: string, newTagId: string): Promise<any> => {

  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItemId };

  const mediaItemDocument: Document = await mediaItemModel.findOne(filter);

  // probably a better way to do this
  const indexOfExistingTagId = mediaItemDocument.get('tagIds').indexOf(existingTagId);
  if (indexOfExistingTagId > -1) {
    mediaItemDocument.get('tagIds')[indexOfExistingTagId] = newTagId;
    mediaItemDocument.markModified('tagIds');
    return await mediaItemDocument.save();
  }

  console.log('existingTagId not found in mediaItemDocument');
  return Promise.resolve();
}


export const replaceTagInDbMediaItems = async (mediaItemIds: string[], existingTagId: string, newTagId: string): Promise<any> => {

  // better db interface to do the this??

  const promises: Promise<any>[] = [];
  mediaItemIds.forEach((mediaItemId: string) => {
    promises.push(replaceTagInDbMediaItem(mediaItemId, existingTagId, newTagId));
  });
  return Promise.all(promises)
    .then(() => {
      return Promise.resolve();
    })
}

export const deleteTagFromDbMediaItem = async (mediaItemId: string, tagId: string): Promise<any> => {

  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItemId };

  const mediaItemDocument: Document = await mediaItemModel.findOne(filter);
  mediaItemDocument.get('tagIds').pull(tagId);
  mediaItemDocument.markModified('tagIds');
  return await mediaItemDocument.save();
}

export const deleteTagFromDbMediaItems = async (mediaItemIds: string[], tagId: string): Promise<any> => {

  // better db interface to do the this??

  const promises: Promise<any>[] = [];
  mediaItemIds.forEach((mediaItemId: string) => {
    promises.push(deleteTagFromDbMediaItem(mediaItemId, tagId));
  });
  return Promise.all(promises)
    .then(() => {
      return Promise.resolve();
    })
}

export const createPhotosToDisplaySpecDocument = async (photosToDisplaySpec: PhotosToDisplaySpec): Promise<Document | void> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDisplaySpecModel.create(photosToDisplaySpec)
    .then((photosToDisplaySpecDocument: any) => {
      return Promise.resolve(photosToDisplaySpecDocument);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

const updateDateRangeSpecificationSelector = async (photosToDisplaySpecModel: any, specifyDateRange: boolean, startDate?: string, endDate?: string): Promise<any> => {
  const update: any = { specifyDateRange };
  if (startDate) {
    update.startDate = startDate;
  }
  if (endDate) {
    update.endDate = endDate;
  }
  const doc = await photosToDisplaySpecModel.findOneAndUpdate({}, update, { new: true });
}

export const setDateRangeSpecificationDb = async (specifyDateRange: boolean, startDate?: string, endDate?: string): Promise<any> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDisplaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            // throw new Error('photosToDisplaySpecDocs.length === 0');
            createPhotosToDisplaySpecDocument({
              specifyDateRange,
              startDate,
              endDate,
              specifyTagExistence: false,
              specifySearchWithTags: false,
              tagIds: [],
            })
              .then((photosToDisplayDocument: any) => {
                return Promise.resolve();
              });
          } if (photosToDisplaySpecDocs.length === 1) {
            updateDateRangeSpecificationSelector(photosToDisplaySpecModel, specifyDateRange, startDate, endDate);
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}

const updateTagExistenceSpecificationSelector = async (photosToDisplaySpecModel: any, specifyTagExistence: boolean, tagSelector?: TagSelectorType): Promise<any> => {
  const update: any = { specifyTagExistence };
  if (tagSelector) {
    update.tagSelector = tagSelector;
  }
  const doc = await photosToDisplaySpecModel.findOneAndUpdate({}, update, { new: true });
}

export const setTagExistenceSpecificationDb = async (specifyTagExistence: boolean, tagSelector?: TagSelectorType): Promise<any> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDisplaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            createPhotosToDisplaySpecDocument({
              specifyDateRange: false,
              specifyTagExistence,
              tagSelector,
              specifySearchWithTags: false,
              tagIds: [],
            })
              .then((photosToDisplayDocument: any) => {
                return Promise.resolve();
              });
          } if (photosToDisplaySpecDocs.length === 1) {
            updateTagExistenceSpecificationSelector(photosToDisplaySpecModel, specifyTagExistence, tagSelector);
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}


const updateTagSelector = async (tagSelector: string): Promise<any> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  const update: any = { tagSpec: tagSelector };
  const doc = await photosToDisplaySpecModel.findOneAndUpdate({}, update, { new: true });
}

export const setTagSelectorDb = async (tagSelector: TagSelectorType): Promise<any> => {
  const photoToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photoToDisplaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            throw new Error('photosToDisplaySpecDocs.length === 0');
          } if (photosToDisplaySpecDocs.length === 1) {
            updateTagSelector(tagSelector);
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}

export const getPhotosToDisplaySpecFromDb = async (): Promise<PhotosToDisplaySpec> => {

  console.log('getPhotosToDisplaySpecFromDb');

  const photoToDisplaySpecModel = getPhotosToDisplaySpecModel();

  let photosToDisplaySpec: PhotosToDisplaySpec = {
    specifyDateRange: false,
    specifyTagExistence: false,
    specifySearchWithTags: false,
    tagIds: [],
  };

  const documents: any = await (photoToDisplaySpecModel as any).find().exec();
  if (documents.length === 0) {
    console.log('photosToDisplaySpecDocs.length === 0');
  } else {
    photosToDisplaySpec = documents[0].toObject() as PhotosToDisplaySpec;
  }

  return photosToDisplaySpec;
}

export const assignTagAvatarToDbTag = async (tagId: string, avatarType: string, avatarId: string): Promise<any> => {

  console.log(tagId, avatarType, avatarId);

  const tagModel = getTagModel();

  const filter = { id: tagId };
  const tagDocument: Document = await tagModel.findOne(filter);
  if (!isNil(tagDocument)) {
    tagDocument.set('avatarType', avatarType);
    tagDocument.set('avatarId', avatarId);
    tagDocument.save();
  }
}

export const updateDbTagLabel = async (tagId: string, tagLabel: string): Promise<any> => {

  const tagModel = getTagModel();

  const filter = { id: tagId };
  const tagDocument: Document = await tagModel.findOne(filter);
  if (!isNil(tagDocument)) {
    tagDocument.set('label', tagLabel);
    tagDocument.save();
  }
}


export const createAppTagAvatarDocument = async (appTagAvatar: AppTagAvatar): Promise<Document | void> => {
  const appTagAvatarModel = getAppTagAvatarModel();
  return appTagAvatarModel.create(appTagAvatar)
    .then((appTagAvatarDocument: any) => {
      return Promise.resolve(appTagAvatarDocument);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const getAllAppTagAvatarsFromDb = async (): Promise<AppTagAvatar[]> => {

  const appTagAvatarModel = getAppTagAvatarModel();

  const appTagAvatars: AppTagAvatar[] = [];
  const documents: any = await (appTagAvatarModel as any).find().exec();
  for (const document of documents) {
    const appTagAvatar: AppTagAvatar = document.toObject() as AppTagAvatar;
    appTagAvatar.id = document.id.toString();
    appTagAvatar.label = document.label.toString();
    appTagAvatar.pathToLarge = document.pathToLarge.toString();
    appTagAvatar.path = document.path.toString();
    appTagAvatars.push(appTagAvatar);
  }
  return appTagAvatars;
}

export const createUserTagAvatarDocument = async (userTagAvatar: UserTagAvatar): Promise<string> => {
  const userTagAvatarModel = getUserTagAvatarModel();
  return userTagAvatarModel.create(userTagAvatar)
    .then((userTagAvatarDocument: any) => {
      const userTagAvatar: UserTagAvatar = userTagAvatarDocument.toObject() as UserTagAvatar;
      const userTagAvatarId = userTagAvatar.id;
      return Promise.resolve(userTagAvatarId);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const getAllUserTagAvatarsFromDb = async (): Promise<UserTagAvatar[]> => {

  const userTagAvatarModel = getUserTagAvatarModel();

  const userTagAvatars: UserTagAvatar[] = [];
  const documents: any = await (userTagAvatarModel as any).find().exec();
  for (const document of documents) {
    const userTagAvatar: UserTagAvatar = document.toObject() as UserTagAvatar;
    userTagAvatar.id = document.id.toString();
    userTagAvatar.label = document.label.toString();
    userTagAvatar.path = document.path.toString();
    userTagAvatars.push(userTagAvatar);
  }
  return userTagAvatars;
}

export const getKeywordsFromDb = async (): Promise<Keyword[]> => {
  const keywordModel = getKeywordModel();
  const keywords: Keyword[] = [];
  const keywordDocuments: any = await (keywordModel as any).find().exec();
  for (const document of keywordDocuments) {
    const keyword: Keyword = document.toObject() as Keyword;
    keyword.keywordId = document.keywordId.toString();
    keyword.label = document.label.toString();
    keyword.type = document.type.toString();
    keywords.push(keyword);
  }
  return keywords;
}

export const getKeywordNodesFromDb = async (): Promise<KeywordNode[]> => {
  const keywordNodeModel = getKeywordNodeModel();
  const keywordNodes: KeywordNode[] = [];
  const keywordNodeDocuments: any = await (keywordNodeModel as any).find().exec();
  for (const document of keywordNodeDocuments) {
    const keywordNode: KeywordNode = document.toObject() as KeywordNode;
    keywordNode.nodeId = document.nodeId.toString();
    keywordNode.keywordId = document.keywordId.toString();
    keywordNodes.push(keywordNode);
  }
  return keywordNodes;
}

export const getKeywordRootNodeIdFromDb = async (): Promise<string> => {
  const keywordTreeNodeModel = getKeywordTreeModel();
  const keywordTreeNodeDocuments: any = await (keywordTreeNodeModel as any).find().exec();
  if (keywordTreeNodeDocuments.length === 0) {
    return '';
  } else if (keywordTreeNodeDocuments.length > 1) {
    debugger;
  } else {
    return keywordTreeNodeDocuments[0].toObject().rootNodeId;
  }
}

export const getAllKeywordDataFromDb = async (): Promise<any> => {

  const keywords: Keyword[] = await getKeywordsFromDb();
  const keywordNodes: KeywordNode[] = await getKeywordNodesFromDb();
  const keywordRootNodeId: string = await getKeywordRootNodeIdFromDb();

  return {
    keywords,
    keywordNodes,
    keywordRootNodeId,
  };
}

export const createKeywordDocument = async (keyword: Keyword): Promise<string> => {
  const keywordModel = getKeywordModel();
  return keywordModel.create(keyword)
    .then((keywordDocument: any) => {
      const keyword: Keyword = keywordDocument.toObject() as Keyword;
      return Promise.resolve(keyword.keywordId);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const createKeywordNodeDocument = async (keywordNode: KeywordNode): Promise<string> => {
  const keywordNodeModel = getKeywordNodeModel();
  return keywordNodeModel.create(keywordNode)
    .then((keywordNodeDocument: any) => {
      const keywordNode: KeywordNode = keywordNodeDocument.toObject() as KeywordNode;
      return Promise.resolve(keywordNode.nodeId);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const setRootKeywordNodeDb = async (rootNodeId: string): Promise<void> => {
  const keywordTreeModel = getKeywordTreeModel();
  return keywordTreeModel.create( {rootNodeId })
    .then((keywordTreeDocument: any) => {
      return Promise.resolve();
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}
