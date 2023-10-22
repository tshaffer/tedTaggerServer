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
export const updateTagsInDbMediaItem = async (mediaItemId: string, tagIds: string[]): Promise<any> => {

  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItemId };

  const mediaItemDocument: Document = await mediaItemModel.findOne(filter);
  console.log('existingTagIds');
  console.log((mediaItemDocument.toObject() as MediaItem).tagIds);

  const newTagId = tagIds[tagIds.length - 1];
  console.log('newTagId');
  console.log(newTagId);

  mediaItemDocument.get('tagIds').push(newTagId);
  mediaItemDocument.markModified('tagIds');
  const newDocument: Document = await mediaItemDocument.save();
  console.log('updated documents tagIds');
  console.log(newDocument.get('tagIds'));
  

  // const update = { tagIds: tagIds };
  // const doc = await mediaItemModel.findOneAndUpdate(filter, update, {
  //   new: true
  // });
  // console.log('updated doc');
  // console.log(doc);


  // await mediaItemModel.findOne(filter).then((doc: any) => {
  //   console.log(doc);
  //   (doc as any).tagIds.push(newTagId);
  //   (doc as any).save();
  // });

  /*
    doc.get('tagIds').push('oink')
    2
    doc.get('tagIds')
      (2) ['f6bafbfd-b162-4cb9-9e61-2d48a434af29', 'oink']
    doc.save()
  */
  // await mediaItemModel.findOneAndUpdate(
  //   filter,
  //   { $push: { tagIds: newTagId}},
  //   null,
  //   function (error, success) {
  //     if (error) {
  //         console.log(error);
  //     } else {
  //         console.log(success);
  //     }
  // });

}