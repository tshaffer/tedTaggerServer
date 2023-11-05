import { isArray, isNil } from "lodash";
import {
  getMediaitemModel,
  getTagModel,
} from "../models";
import {
  MediaItem,
  Tag,
} from "../types";
import { Document } from 'mongoose';

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
      console.log('createTagDocument: value returned from tagModel.create:');
      console.log(tagDocument);
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

export const assignTagIconToDbTag = async (tagId: string, iconFileName: string): Promise<any> => {

  console.log(tagId, iconFileName);

  const tagModel = getTagModel();

  const filter = { id: tagId };
  const tagDocument: Document = await tagModel.findOne(filter);
  if (!isNil(tagDocument)) {
    tagDocument.set('iconFileName', iconFileName);
    tagDocument.save();
  }
}
