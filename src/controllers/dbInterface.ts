import { v4 as uuidv4 } from 'uuid';

import {
  getMediaitemModel,
  getTagModel,
} from "../models";
import {
  MediaItem,
  Tag,
} from "../types";
import { isArray } from 'lodash';

export const getAllMediaItemsFromDb = async (): Promise<MediaItem[]> => {

  const mediaItemModel = getMediaitemModel();

  const tagNames: Set<string> = new Set<string>();

  const mediaItems: MediaItem[] = [];
  // const documents: any = await (mediaItemModel as any).find().limit(100).exec();
  const documents: any = await (mediaItemModel as any).find().exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);

    if (isArray(mediaItem.people)) {
      // person: { _id, name }
      mediaItem.people.forEach((person: any) => {
        tagNames.add(person.name);
      });
    }

  }

  if (tagNames.size > 0) {
    await (addTagsSetToDb(tagNames));
  }
  return mediaItems;
}

export const addTagsSetToDb = async (tagsSet: Set<string>): Promise<void> => {

  const existingTags = await getAllTagsFromDb();
  const existingTagNames: string[] = existingTags.map((aTag: Tag) => {
    return aTag.label;
  })
  const existingTagsSet: Set<string> = new Set<string>(existingTagNames);

  const tagsToAddToDb: Tag[] = [];

  for (let tag of tagsSet) {
    if (!existingTagsSet.has(tag)) {
      tagsToAddToDb.push({
        id: uuidv4(),
        label: tag,
      });
    }
  }

  if (tagsToAddToDb.length > 0) {
    const tagModel = getTagModel();
    try {
      return tagModel.collection.insertMany(tagsToAddToDb)
        .then((retVal: any) => {
          console.log('tags added successfully');
          console.log(retVal);
          return;
        })
        .catch((error: any) => {
          console.log('db add error: ', error);
          if (error.code === 11000) {
            return;
          } else {
            debugger;
          }
        });
    } catch (error: any) {
      debugger;
    }
  }
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

