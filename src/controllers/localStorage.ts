import { v4 as uuidv4 } from 'uuid';

import { ExifDateTime, Tags } from "exiftool-vendored";
import { parse, format } from 'date-fns';

import { getImageFilePaths, retrieveExifData, valueOrNull } from "../utilities";
import { GeoData, MediaItem } from "entities";
import { isNil } from "lodash";
import path from 'path';

export const importFromLocalStorage = async (folder: string): Promise<any> => {

  console.log('importFromLocalStorage');
  console.log('folder:', folder);

  const imageFilePaths: string[] = getImageFilePaths(folder);
  // console.log('imageFiles:', imageFilePaths);

  const index = 0;
  const fullPath = imageFilePaths[index];

  const exifData: Tags = await retrieveExifData(fullPath);
  console.log('exifData:', exifData);

  const isoCreateDate: string | null = await convertCreateDateToISO(exifData);
  const geoData: GeoData | null = await extractGeoData(exifData);

  const dbMediaItem: MediaItem = {
    googleId: uuidv4(),
    fileName: path.basename(fullPath),
    albumId: '',
    filePath: fullPath,
    productUrl: null,
    baseUrl: null,
    mimeType: valueOrNull(exifData.MIMEType),
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

  console.log('dbMediaItem:', dbMediaItem);
  
  return Promise.resolve();
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
      // If CreateDate is an ExifDateTime object, use its properties directly
      isoDateString = createDate.toISOString();
    } else {
      // If CreateDate is a string, parse and format it
      // Assuming the string format is "YYYY:MM:DD HH:MM:SS"
      const parsedDate = new Date(createDate.replace(/:/g, '-').replace(' ', 'T') + 'Z');
      isoDateString = format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }

    return isoDateString;
  } catch (err) {
    console.error('Error converting CreateDate to ISO format:', err);
    return null;
  }
}
