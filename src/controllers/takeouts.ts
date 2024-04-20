import { isNil } from "lodash";
import { AddedTakeoutData, Keyword, KeywordData, KeywordNode, MediaItem } from '../types';
import { getAuthService } from "./googlePhotosService";
import { AuthService } from "../auth";
import { GoogleAlbum, GoogleMediaItem } from "googleTypes";
import { GooglePhotoAPIs, getAlbumMediaItemsFromGoogle, getGoogleAlbumDataByName } from "./googlePhotos";
import { addAutoPersonKeywordsToDb, addMediaItemToMediaItemsDBTable, getAllMediaItemsFromDb, getAutoPersonKeywordNodesFromDb, getKeywordsFromDb, getMediaItemsInAlbumFromDb } from "./dbInterface";
import { getJsonFilePaths, getImageFilePaths, isImageFile, getJsonFromFile, retrieveExifData, valueOrNull, fsLocalFolderExists, fsCreateNestedDirectory } from "../utilities";
import { FilePathToExifTags, StringToStringLUT } from '../types';
import { Tags } from "exiftool-vendored";
import * as path from 'path';
import { downloadMediaItems, downloadMediaItemsMetadata } from "./googleDownloader";

export let authService: AuthService;

// get googleMediaItems for named album
const getAlbumItems = async (authService: AuthService, albumId: string): Promise<GoogleMediaItem[]> => {
  const googleMediaItemsInAlbum: GoogleMediaItem[] = await getAlbumMediaItemsFromGoogle(authService, albumId, null);
  return googleMediaItemsInAlbum;
}

//  input parameters
//    albumName - corresponding to takeout file
//    takeoutFolder - folder containing metadata for the files retrieved from a single takeout
export const importFromTakeout = async (albumName: string, takeoutFolder: string): Promise<AddedTakeoutData> => {

  console.log('importFromTakeout');

  // Step 0
  // connect to db; acquire authService
  if (isNil(authService)) {
    authService = await getAuthService();
  }

  // Step 1
  // get the google album metadata for named album
  const googleAlbum: GoogleAlbum | null = await getGoogleAlbumDataByName(authService, albumName);
  if (isNil(googleAlbum)) {
    // TEDTODO
    // if album does not exist, inform user and return
    return;
  };
  const albumId = googleAlbum.id;
  // const albumId = 'AEEKk93_i7XXOBVcq3lfEtP2XOEkjUtim6tm9HjkimxvIC7j8y2o-e0MPazRGr5nlAgf_OAyGxYX';
  // const albumId = 'AEEKk93_i7XXOBVcq3lfEtP2XOEkjUtim6tm9HjkimxvIC7j8y2o-e0MPazRGr5nlAgf_OAyGxYX';

  // Step 2
  // get the googleMediaItems for this album
  const googleMediaItemsInAlbum: GoogleMediaItem[] = await getAlbumItems(authService, albumId);

  // Step 3
  // Get existing db mediaItems for this album
  const mediaItemsInDb: MediaItem[] = await getMediaItemsInAlbumFromDb(albumId);

  // Step 4
  if (mediaItemsInDb.length === 0) {
    // If there are no mediaItems in the db for this album, add all the mediaItems in the album
    const addedTakeoutData: AddedTakeoutData = await addAllMediaItemsFromTakeout(takeoutFolder, googleMediaItemsInAlbum, albumId);
    return addedTakeoutData;
  } else {
    // There are existing mediaItems in the db for this album. Compare the existing mediaItems in the db with the mediaItems in the album (and the takeout)
    debugger; // need to add support for converting people to tags, etc.
    // await mergeMediaItemsFromAlbumWithDb(takeoutFolder, googleMediaItemsInAlbum, albumId, mediaItemsInDb);
  }
}

const addAllMediaItemsFromTakeout = async (takeoutFolder: string, googleMediaItemsInAlbum: GoogleMediaItem[], albumId: string): Promise<AddedTakeoutData> => {

  // TEDTODO - should not be hard coded
  const mediaItemsDir = '/Users/tedshaffer/Documents/Projects/tedTaggerServer/public/images';

  // retrieve metadata files and image files from takeout folder
  takeoutFolder = path.join('public/takeouts', takeoutFolder);
  console.log('takeoutFolder', takeoutFolder);

  const takeoutMetaDataFilePaths: string[] = await getJsonFilePaths(takeoutFolder);
  const takeoutImageFilePaths: string[] = await getImageFilePaths(takeoutFolder);

  console.log(takeoutMetaDataFilePaths.length);
  console.log(takeoutImageFilePaths.length);

  const takeoutMetaDataFilePathsByImageFileName: StringToStringLUT = {};
  const takeoutExifDataByImageFileName: FilePathToExifTags = {};
  for (const imageFilePath of takeoutImageFilePaths) {
    const takeoutMetadataFilePath = imageFilePath + '.json';
    const indexOfMetaDataFilePath = takeoutMetaDataFilePaths.indexOf(takeoutMetadataFilePath);
    if (indexOfMetaDataFilePath >= 0) {
      takeoutMetaDataFilePathsByImageFileName[path.basename(imageFilePath)] = takeoutMetadataFilePath;
    }
    const exifData: Tags = await retrieveExifData(imageFilePath);
    takeoutExifDataByImageFileName[path.basename(imageFilePath)] = exifData;
  };

  // first pass - gather all people and descriptions; generate tags; generate keywords`

  // iterate through each media item in the album.

  const personKeywordNames: Set<string> = new Set<string>();

  for (const mediaItemMetadataFromGoogleAlbum of googleMediaItemsInAlbum) {
    const googleFileName = mediaItemMetadataFromGoogleAlbum.filename;
    if (isImageFile(googleFileName)) {
      if (takeoutMetaDataFilePathsByImageFileName.hasOwnProperty(googleFileName)) {
        const takeoutMetaDataFilePath = takeoutMetaDataFilePathsByImageFileName[googleFileName];
        const takeoutMetadata: any = await getJsonFromFile(takeoutMetaDataFilePath);
        if (!isNil(takeoutMetadata.people)) {
          takeoutMetadata.people.forEach((person: any) => {
            personKeywordNames.add(person.name);
          });
        }
      }
    }
  }

  let addedKeywordData: KeywordData = null;
  const addedMediaItems: MediaItem[] = [];

  if (personKeywordNames.size > 0) {
    addedKeywordData = await (addAutoPersonKeywordsToDb(personKeywordNames));
  }

  const keywords: Keyword[] = await getKeywordsFromDb();

  const autoPersonKeywordNodes: KeywordNode[] = await getAutoPersonKeywordNodesFromDb();

  const personNameToAutoPersonKeywordNodeId: StringToStringLUT = {};
  personKeywordNames.forEach((personName: string) => {
    autoPersonKeywordNodes.forEach((autoPersonKeywordNode: KeywordNode) => {
      const autoPersonKeywordId: string = autoPersonKeywordNode.keywordId;
      const keyword: Keyword = keywords.find((keyword: Keyword) => keyword.keywordId === autoPersonKeywordId);
      if (keyword.label === personName) {
        personNameToAutoPersonKeywordNodeId[personName] = autoPersonKeywordNode.nodeId;
      }
    });
  });


  const keywordIdByKeywordLabel: StringToStringLUT = {};
  keywords.forEach((keyword: Keyword) => {
    keywordIdByKeywordLabel[keyword.label] = keyword.keywordId;
  })

  // if it is an image file, see if there is a corresponding entry in the takeout folder
  for (const mediaItemMetadataFromGoogleAlbum of googleMediaItemsInAlbum) {

    const googleFileName = mediaItemMetadataFromGoogleAlbum.filename;

    if (isImageFile(googleFileName)) {

      if (takeoutMetaDataFilePathsByImageFileName.hasOwnProperty(googleFileName)) {

        const fileSuffix = path.extname(mediaItemMetadataFromGoogleAlbum.filename);
        const fileName = mediaItemMetadataFromGoogleAlbum.id + fileSuffix;

        const baseDir: string = await getShardedDirectory(mediaItemsDir, mediaItemMetadataFromGoogleAlbum.id);
        // const from = path.join(takeoutFolder, googleFileName);
        const where = path.join(baseDir, fileName);

        // move file to mediaItemsDir
        // console.log(from);
        // console.log(where);
        // fsRenameFile(from, where);

        const takeoutMetaDataFilePath = takeoutMetaDataFilePathsByImageFileName[googleFileName];
        const takeoutMetadata: any = await getJsonFromFile(takeoutMetaDataFilePath);

        let exifData: Tags | null = null;
        if (takeoutExifDataByImageFileName.hasOwnProperty(googleFileName)) {
          exifData = takeoutExifDataByImageFileName[googleFileName];
        }

        const keywordNodeIds: string[] = [];

        if (!isNil(takeoutMetadata.people)) {
          takeoutMetadata.people.forEach((person: any) => {
            const name: string = person.name;
            keywordNodeIds.push(personNameToAutoPersonKeywordNodeId[name]);
          })
        }

        // generate mediaItem tags from people
        const dbMediaItem: MediaItem = {
          googleId: mediaItemMetadataFromGoogleAlbum.id,
          fileName: mediaItemMetadataFromGoogleAlbum.filename,
          albumId,
          filePath: where,
          productUrl: valueOrNull(mediaItemMetadataFromGoogleAlbum.productUrl),
          baseUrl: valueOrNull(mediaItemMetadataFromGoogleAlbum.baseUrl),
          mimeType: valueOrNull(mediaItemMetadataFromGoogleAlbum.mimeType),
          creationTime: valueOrNull(mediaItemMetadataFromGoogleAlbum.mediaMetadata.creationTime),
          width: valueOrNull(mediaItemMetadataFromGoogleAlbum.mediaMetadata.width, true),
          height: valueOrNull(mediaItemMetadataFromGoogleAlbum.mediaMetadata.height, true),
          orientation: isNil(exifData) ? null : valueOrNull(exifData.Orientation),
          // description from exifData or from takeoutMetadata? - I'm not sure that what's below makes sense.
          // description: isNil(exifData) ? null : valueOrNull(takeoutMetadata.description),
          description: valueOrNull(takeoutMetadata.description),
          geoData: valueOrNull(takeoutMetadata.geoData),
          people: valueOrNull(takeoutMetadata.people),
          keywordNodeIds,
        }

        addedMediaItems.push(dbMediaItem);

        await addMediaItemToMediaItemsDBTable(dbMediaItem);

      }
    }
  }

  console.log('db additions complete');

  downloadGooglePhotos(mediaItemsDir);

  const addedTakeoutData: AddedTakeoutData = {
    addedKeywordData,
    addedMediaItems
  };
  return addedTakeoutData;
}

const downloadGooglePhotos = async (mediaItemsDir: string) => {

  console.log('downloadGooglePhotos');
  console.log(mediaItemsDir);

  const mediaItemsToDownload: MediaItem[] = await getAllMediaItems();

  console.log('mediaItemsToDownload count: ' + mediaItemsToDownload.length);

  const mediaItemGroups: MediaItem[][] = createGroups(mediaItemsToDownload, GooglePhotoAPIs.BATCH_GET_LIMIT);
  console.log('mediaItemGroups count: ' + mediaItemGroups.length);

  if (isNil(authService)) {
    authService = await getAuthService();
  }

  const miniMediaItemGroups: MediaItem[][] = [];
  for (let mediaGroupIndex = 0; mediaGroupIndex < mediaItemGroups.length; mediaGroupIndex++) {
    const mediaItemGroup: MediaItem[] = mediaItemGroups[mediaGroupIndex];
    miniMediaItemGroups.push(mediaItemGroup);
  }

  await Promise.all(
    miniMediaItemGroups.map((mediaItems: MediaItem[]) => {
      return downloadMediaItemsMetadata(authService, mediaItems);
    }
    ));

  await downloadMediaItems(authService, miniMediaItemGroups, mediaItemsDir);

  return Promise.resolve();
}


let shardedDirectoryExistsByPath: any = {};

const getShardedDirectory = async (mediaItemsDir: string, photoId: string): Promise<string> => {

  const numChars = photoId.length;
  const targetDirectory = path.join(
    mediaItemsDir,
    photoId.charAt(numChars - 2),
    photoId.charAt(numChars - 1),
  );

  return fsLocalFolderExists(targetDirectory)
    .then((dirExists: boolean) => {
      shardedDirectoryExistsByPath[targetDirectory] = true;
      if (dirExists) {
        return Promise.resolve(targetDirectory);
      }
      else {
        return fsCreateNestedDirectory(targetDirectory)
          .then(() => {
            return Promise.resolve(targetDirectory);
          });
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return Promise.reject();
    });
};

const createGroups = (mediaItems: MediaItem[], groupSize: number): MediaItem[][] => {

  const groups: MediaItem[][] = [];

  const numOfGroups = Math.ceil(mediaItems.length / groupSize);
  for (let i = 0; i < numOfGroups; i++) {
    const startIdx = i * groupSize;
    const endIdx = i * groupSize + groupSize;

    const subItems: MediaItem[] = mediaItems.slice(startIdx, endIdx);
    groups.push(subItems);
  }

  return groups;
}

const getAllMediaItems = async (): Promise<MediaItem[]> => {
  const allMediaItems: MediaItem[] = await getAllMediaItemsFromDb();
  return allMediaItems;
}


