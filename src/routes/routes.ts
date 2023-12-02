import express from 'express';
import {
  getIndex,
  getCSS,
  getBundle,
  getBundleMap,
  getImage,
  getMediaItemsToDisplay,
  getTags,
  getVersion,
  getPhotosToDisplaySpec,
  addTag,
  addTagToMediaItems,
  replaceTagInMediaItems,
  assignTagAvatarToTag,
  setEndDate,
  setStartDate,
  setDateSelector,
  uploadUserAvatarFile,
  deleteTagFromMediaItems,
  setTagSelector,
  getAppTagAvatars,
  getUserTagAvatars,
  addUserAvatar,
} from '../controllers';
import { addAppAvatars, createPhotosToDisplaySpec } from '../utilities/utilities';

export class Routes {

  public routes(app: express.Application): void {
    this.createRoutes(app);
  }

  createRoutes(app: express.Application) {
    app.get('/', getIndex);
    app.get('/app', getIndex);
    app.get('/index.html', getIndex);
    app.get('/css/app.css', getCSS);
    app.get('/build/bundle.js', getBundle);
    app.get('/build/bundle.js.map', getBundleMap);
    app.get('/images/test.jpg', getImage);

    app.get('/api/v1/version', getVersion);
    app.get('/api/v1/addAppAvatars', addAppAvatars)
    app.get('/api/v1/createPhotosToDisplaySpec', createPhotosToDisplaySpec)
    app.get('/api/v1/mediaItemsToDisplay', getMediaItemsToDisplay);
    app.get('/api/v1/tags', getTags);
    app.get('/api/v1/photosToDisplaySpec', getPhotosToDisplaySpec);
    app.get('/api/v1/appTagAvatars', getAppTagAvatars);
    app.get('/api/v1/userTagAvatars', getUserTagAvatars);

    app.post('/api/v1/addTag', addTag)
    app.post('/api/v1/addTagToMediaItems', addTagToMediaItems)
    app.post('/api/v1/replaceTagInMediaItems', replaceTagInMediaItems)
    app.post('/api/v1/deleteTagFromMediaItems', deleteTagFromMediaItems)

    app.post('/api/v1/addUserAvatar', addUserAvatar)
    app.post('/api/v1/uploadUserAvatarFile', uploadUserAvatarFile);
    app.post('/api/v1/assignTagAvatarToTag', assignTagAvatarToTag);

    app.post('/api/v1/setDateSelector', setDateSelector);
    app.post('/api/v1/setTagSelector', setTagSelector);
    app.post('/api/v1/setStartDate', setStartDate);
    app.post('/api/v1/setEndDate', setEndDate);

  }
}
