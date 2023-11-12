import { isArray, isNil } from "lodash";
import {
  getMediaitemModel,
  getTagModel,
} from "../models";
import {
  MediaItem,
  Tag,
  ViewSpec,
  ViewSpecDb,
  ViewSpecType,
} from "../types";
import { Document } from 'mongoose';
import { getViewSpecModel } from "../models/ViewSpec";

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
  viewSpec: string,
  startDate: string,
  endDate: string,
): Promise<MediaItem[]> => {

  let querySpec = {};

  switch (viewSpec) {
    case ViewSpecType.All.toString():
    default: {
      break;
    }
    case ViewSpecType.ByDateRange.toString(): {
      querySpec = { creationTime: { $gte: startDate, $lte: endDate } };
      break;
    }
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

const createViewSpecDocument = async (viewSpec: ViewSpecDb): Promise<Document | void> => {
  const viewSpecModel = getViewSpecModel();
  return viewSpecModel.create(viewSpec)
    .then((viewSpecDocument: any) => {
      console.log('createViewSpecDocument: value returned from viewSpecModel.create:');
      console.log(viewSpecDocument);
      return Promise.resolve(viewSpecDocument);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const setViewSpecTypeDb = async (viewSpecType: string): Promise<any> => {
  const viewSpecModel = getViewSpecModel();
  return viewSpecModel.find({}
    , (err: any, viewSpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(viewSpecDocs)) {
          if (viewSpecDocs.length === 0) {
            createViewSpecDocument({
              type: viewSpecType,
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
            })
              .then((viewSpecDocument: any) => {
                console.log('createViewSpecDocument: value returned from viewSpecModel.create:');
                console.log(viewSpecDocument);
                return Promise.resolve(viewSpecDocument);
              });
          } if (viewSpecDocs.length === 1) {
            const viewSpecDoc: any = viewSpecDocs[0];
            viewSpecDoc.viewSpecType = viewSpecType;
            viewSpecDoc.save();
            return Promise.resolve();
          }
        } else {
          console.log('viewSpecDocs is not an array');
          return Promise.reject('viewSpecDocs is not an array');
        }
    });
}

export const setStartDateDb = async (startDate: string): Promise<any> => {
  const viewSpecModel = getViewSpecModel();
  return viewSpecModel.find({}
    , (err: any, viewSpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(viewSpecDocs)) {
          if (viewSpecDocs.length === 0) {
            createViewSpecDocument({
              type: ViewSpecType.All.toString(),
              startDate,
              endDate: new Date().toISOString(),
            })
              .then((viewSpecDocument: any) => {
                console.log('createViewSpecDocument: value returned from viewSpecModel.create:');
                console.log(viewSpecDocument);
                return Promise.resolve(viewSpecDocument);
              });
          } if (viewSpecDocs.length === 1) {
            const viewSpecDoc: any = viewSpecDocs[0];
            viewSpecDoc.startDate = startDate;
            viewSpecDoc.save();
            return Promise.resolve();
          }
        } else {
          console.log('viewSpecDocs is not an array');
          return Promise.reject('viewSpecDocs is not an array');
        }
    });
}

export const setEndDateDb = async (endDate: string): Promise<any> => {
  const viewSpecModel = getViewSpecModel();
  return viewSpecModel.find({}
    , (err: any, viewSpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(viewSpecDocs)) {
          if (viewSpecDocs.length === 0) {
            createViewSpecDocument({
              type: ViewSpecType.All.toString(),
              startDate: new Date().toISOString(),
              endDate,
            })
              .then((viewSpecDocument: any) => {
                console.log('createViewSpecDocument: value returned from viewSpecModel.create:');
                console.log(viewSpecDocument);
                return Promise.resolve(viewSpecDocument);
              });
          } if (viewSpecDocs.length === 1) {
            const viewSpecDoc: any = viewSpecDocs[0];
            viewSpecDoc.endDate = endDate;
            viewSpecDoc.save();
            return Promise.resolve();
          }
        } else {
          console.log('viewSpecDocs is not an array');
          return Promise.reject('viewSpecDocs is not an array');
        }
    });
} 

export const getViewSpecFromDb = async (): Promise<ViewSpec> => {
  
  const viewSpecModel = getViewSpecModel();

  let viewSpec: ViewSpec = {
    viewSpecType: ViewSpecType.All,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  };
  
  const documents: any = await (viewSpecModel as any).find().exec();

  for (const document of documents) {
    const viewSpecDb: ViewSpecDb = document.toObject() as ViewSpecDb;
    // console.log('getViewSpecFromDb: viewSpec', viewSpec);

    let viewSpecType: ViewSpecType = ViewSpecType.All;
    const viewSpecTypeDb = viewSpecDb.type;
    switch (viewSpecTypeDb) {
      case ViewSpecType.All.toString():
        default: {
          break;
        }
      case ViewSpecType.ByDateRange.toString(): {
        viewSpecType = ViewSpecType.ByDateRange;
        break;
      } 
    }
    viewSpec = {
      viewSpecType,
      startDate: viewSpecDb.startDate,
      endDate: viewSpecDb.endDate,
    }
  }

  return viewSpec;
}
