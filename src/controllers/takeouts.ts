import { isNil } from "lodash";
import { MediaItem } from '../types/entities'
import { getAuthService } from "./googlePhotosService";
import { AuthService } from "../auth";
import { GoogleAlbum } from "googleTypes";
import { getGoogleAlbumDataByName } from "./googlePhotos";

export let authService: AuthService;

//  input parameters
//    albumName - corresponding to takeout file
//    takeoutFolder - folder containing metadata for the files retrieved from a single takeout
export const mergeFromTakeout = async (albumName: string, takeoutFolder: string) => {

  console.log('mergeFromTakeout');

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
  // const albumId = googleAlbum.id;
  // // const albumId = 'AEEKk93_i7XXOBVcq3lfEtP2XOEkjUtim6tm9HjkimxvIC7j8y2o-e0MPazRGr5nlAgf_OAyGxYX';
  // // const albumId = 'AEEKk93_i7XXOBVcq3lfEtP2XOEkjUtim6tm9HjkimxvIC7j8y2o-e0MPazRGr5nlAgf_OAyGxYX';

  // // Step 2
  // // get the googleMediaItems for this album
  // const googleMediaItemsInAlbum: GoogleMediaItem[] = await getAlbumItems(authService, albumId);

  // // Step 3
  // // Get existing db mediaItems for this album
  // const mediaItemsInDb: MediaItem[] = await getMediaItemsInAlbumFromDb(albumId);

  // // Step 4
  // if (mediaItemsInDb.length === 0) {
  //   // If there are no mediaItems in the db for this album, add all the mediaItems in the album
  //   await addAllMediaItemsFromTakeout(takeoutFolder, googleMediaItemsInAlbum, albumId);
  // } else {
  //   // There are existing mediaItems in the db for this album. Compare the existing mediaItems in the db with the mediaItems in the album (and the takeout)
  //   debugger; // need to add support for converting people to tags, etc.
  //   await mergeMediaItemsFromAlbumWithDb(takeoutFolder, googleMediaItemsInAlbum, albumId, mediaItemsInDb);
  // }

}

