import { v4 as uuidv4 } from 'uuid';

import { ExifDateTime, Tags } from "exiftool-vendored";

import { fsCopyFile, getImageFilePaths, getShardedDirectory, isImageFile, retrieveExifData, valueOrNull } from "../utilities";
import { GeoData, MediaItem } from "entities";
import { isNil } from "lodash";
import path from 'path';
import { DateTime } from 'luxon';
import { addMediaItemToMediaItemsDBTable } from './dbInterface';

const { promisify } = require('util');
const fs = require('fs');
const convert = require('heic-convert');

export const importFromLocalStorage = async (localStorageFolder: string): Promise<any> => {

  console.log('importFromLocalStorage: ', localStorageFolder);

  // get the mediaItems associated with the images in the localStorageFolder
  console.log('invoke getImageFilePaths');
  const heicFilePaths: string[] = getImageFilePaths(localStorageFolder);

  console.log('invoke convertHEICFilesToJPEG');
  const jpegFilePaths: string[] = await convertHEICFilesToJPEG(heicFilePaths);

  console.log('invoke getLocalStorageMediaItems');
  const localStorageMediaItems: MediaItem[] = await getLocalStorageMediaItems(heicFilePaths, jpegFilePaths);

  // // skip step that checks for image file existence in db

  // // add the mediaItems to the db
  console.log('invoke addMediaItemsFromLocalStorage');
  await addMediaItemsFromLocalStorage(localStorageFolder, localStorageMediaItems);

  console.log('importFromLocalStorage complete');
  return Promise.resolve();
}

async function convertHEICFilesToJPEG(heicFilePaths: string[]): Promise<string[]> {

  const jpegFilePaths: string[] = [];

  for (const heicFilePath of heicFilePaths) {
    if (heicFilePath.endsWith('.HEIC')) {
      const jpegFilePath: string = await convertHEICFileToJPEG(heicFilePath);
      jpegFilePaths.push(jpegFilePath);
    } else {
      console.error('File is not a HEIC file:', heicFilePath);
    }
  }

  return jpegFilePaths;
}

async function convertHEICFileToJPEG(heicFilePath: string): Promise<string> {

  const inputBuffer = await promisify(fs.readFile)(heicFilePath);
  const outputBuffer = await convert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 1           // the jpeg compression quality, between 0 and 1
  });

  const jpegFilePath = heicFilePath.replace('.HEIC', '.JPG');
  await promisify(fs.writeFile)(jpegFilePath, outputBuffer);
  return jpegFilePath;
}

async function getLocalStorageMediaItems(heicFilePaths: string[], imageFilePaths: string[]): Promise<MediaItem[]> {

  const mediaItems: MediaItem[] = await Promise.all(imageFilePaths.map(async (imageFilePath, index) => {
    const mediaItem: MediaItem = await getLocalStorageMediaItem(heicFilePaths[index], imageFilePath);
    return mediaItem;
  }));

  return mediaItems;
}

async function getLocalStorageMediaItem(heicFilePath: string, fullPath: string): Promise<MediaItem> {

  const exifData: Tags = await retrieveExifData(heicFilePath);
  const isoCreateDate: string | null = await convertCreateDateToISO(exifData);
  const geoData: GeoData | null = await extractGeoData(exifData);

  const mediaItem: MediaItem = {
    googleId: uuidv4(),
    fileName: path.basename(fullPath),
    albumId: '',
    filePath: fullPath,
    productUrl: null,
    baseUrl: null,
    mimeType: 'image/jpeg',
    creationTime: isoCreateDate,
    width: exifData.ImageWidth, // or ExifImageWidth?
    height: exifData.ImageHeight, // or ExifImageHeight?
    orientation: isNil(exifData) ? null : valueOrNull(exifData.Orientation),
    // description from exifData or from takeoutMetadata? - I'm not sure that what's below makes sense.
    // description: isNil(exifData) ? null : valueOrNull(takeoutMetadata.description),
    description: null,
    geoData,
    people: null,
    keywordNodeIds: []
  }

  return mediaItem;
}

async function extractGeoData(tags: Tags): Promise<GeoData | null> {
  try {
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const geoData: GeoData = {
        latitude: tags.GPSLatitude,
        longitude: tags.GPSLongitude,
        altitude: tags.GPSAltitude || 0, // Default to 0 if altitude is not available
        latitudeSpan: 0, // Adjust based on your needs
        longitudeSpan: 0, // Adjust based on your needs
      };
      return geoData;
    } else {
      console.error('No GPS data found in EXIF tags');
      return null;
    }
  } catch (err) {
    console.error('Error reading EXIF data:', err);
    return null;
  }
}

async function convertCreateDateToISO(tags: Tags): Promise<string | null> {
  try {
    const createDate = tags.CreateDate; // ExifDateTime | string | undefined
    if (!createDate) {
      throw new Error('CreateDate not found in EXIF tags');
    }
    
    let isoDateString: string;

    if (createDate instanceof ExifDateTime) {
      // If CreateDate is an ExifDateTime object, use its properties directly and set to UTC
      const dateTime = DateTime.fromObject({
        year: createDate.year,
        month: createDate.month,
        day: createDate.day,
        hour: createDate.hour,
        minute: createDate.minute,
        second: createDate.second,
        millisecond: createDate.millisecond,
        zone: 'utc'
      });
      isoDateString = dateTime.toISO();
    } else {
      // If CreateDate is a string, parse and format it using Luxon and set to UTC
      // Assuming the string format is "yyyy:MM:dd HH:mm:ss"
      const parsedDate = DateTime.fromFormat(createDate, 'yyyy:MM:dd HH:mm:ss', { zone: 'utc' });
      isoDateString = parsedDate.toISO();
    }

    return isoDateString;
  } catch (err) {
    console.error('Error converting CreateDate to ISO format:', err);
    return null;
  }
}

const addMediaItemsFromLocalStorage = async (localStorageFolder: string, mediaItems: MediaItem[]): Promise<any> => {

  // TEDTODO - should not be hard coded
  const mediaItemsDir = '/Users/tedshaffer/Documents/Projects/tedTaggerServer/public/images';

  for (const mediaItem of mediaItems) {
    const mediaItemFileName = mediaItem.fileName;
    if (isImageFile(mediaItemFileName)) {
      const fileSuffix = path.extname(mediaItemFileName);
      const shardedFileName = mediaItem.googleId + fileSuffix;

      const baseDir: string = await getShardedDirectory(mediaItemsDir, mediaItem.googleId);
      const where = path.join(baseDir, shardedFileName);

      mediaItem.filePath = where;

      await addMediaItemToMediaItemsDBTable(mediaItem);

      const sourcePath: string = path.join(localStorageFolder, mediaItemFileName);
      console.log('copy file from: ', sourcePath, ' to: ', where);
      await fsCopyFile(sourcePath, where);
    }
  }

  return [];
}
