import { isArray, isNil } from 'lodash';
import {
  getAppTagAvatarModel,
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
  DateSelectorType,
} from '../types';
import { Document } from 'mongoose';
import { getPhotosToDisplaySpecModel } from '../models/PhotosToDisplaySpec';

export const getAllMediaItemsFromDb = async (): Promise<MediaItem[]> => {

  const mediaItemModel = getMediaitemModel();

  const mediaItems: MediaItem[] = [];
  // const documents: any = await (mediaItemModel as any).find().limit(100).exec();
  const documents: any = await (mediaItemModel as any).find().exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const getMediaItemsToDisplayFromDb = async (
  dateSelector: DateSelectorType,
  tagSpec: TagSelectorType,
  startDate: string,
  endDate: string,
): Promise<MediaItem[]> => {

  let querySpec = {};

  switch (dateSelector) {
    case DateSelectorType.All:
    default: {
      break;
    }
    case DateSelectorType.ByDateRange.toString(): {
      querySpec = { creationTime: { $gte: startDate, $lte: endDate } };
      break;
    }
  }

  if (tagSpec === TagSelectorType.Untagged) {
    querySpec = { ...querySpec, tagIds: { $size: 0 } };
  }

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

const updateDateSelector = async (dateSelector: DateSelectorType): Promise<any> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  const update: any = { dateSelector };
  const doc = await photosToDisplaySpecModel.findOneAndUpdate({}, update, { new: true });
}

export const setDateSelectorDb = async (dateSelector: DateSelectorType): Promise<any> => {
  const photosToDispaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDispaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            throw new Error('photosToDisplaySpecDocs.length === 0');
          } if (photosToDisplaySpecDocs.length === 1) {
            updateDateSelector(dateSelector);
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

export const setStartDateDb = async (startDate: string): Promise<any> => {
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
            const photosToDisplaySpecDoc: any = photosToDisplaySpecDocs[0];
            photosToDisplaySpecDoc.startDate = startDate;
            photosToDisplaySpecDoc.save();
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}

export const setEndDateDb = async (endDate: string): Promise<any> => {
  const photoToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photoToDisplaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            createPhotosToDisplaySpecDocument({
              dateSelector: DateSelectorType.All,
              tagSelector: TagSelectorType.Any,
              startDate: new Date().toISOString(),
              endDate,
            })
              .then((photosToDisplayDocument: any) => {
                return Promise.resolve(photosToDisplayDocument);
              });
          } if (photosToDisplaySpecDocs.length === 1) {
            const photosToDisplayDoc: any = photosToDisplaySpecDocs[0];
            photosToDisplayDoc.endDate = endDate;
            photosToDisplayDoc.save();
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}

export const getPhotosToDisplaySpecFromDb = async (): Promise<PhotosToDisplaySpec> => {

  const photoToDisplaySpecModel = getPhotosToDisplaySpecModel();

  let photosToDisplaySpec: PhotosToDisplaySpec = {
    dateSelector: DateSelectorType.All,
    tagSelector: TagSelectorType.Any,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  };

  const documents: any = await (photoToDisplaySpecModel as any).find().exec();
  if (documents.length === 0) {
    throw new Error('photosToDisplaySpecDocs.length === 0');
  }
  photosToDisplaySpec = documents[0].toObject() as PhotosToDisplaySpec;

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



