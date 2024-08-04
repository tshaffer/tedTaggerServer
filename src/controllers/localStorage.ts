import { Tags } from "exiftool-vendored";
import { getImageFilePaths, retrieveExifData } from "../utilities";

export const importFromLocalStorage = async (folder: string): Promise<any> => {

  console.log('importFromLocalStorage');
  console.log('folder:', folder);

  const imageFilePaths: string[] = getImageFilePaths(folder);
  // console.log('imageFiles:', imageFilePaths);

  const exifData: Tags = await retrieveExifData(imageFilePaths[0]);
  console.log('exifData:', exifData);

  return Promise.resolve();
}

