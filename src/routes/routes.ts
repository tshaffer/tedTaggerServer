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
  getViewSpec,
  addTag,
  addTagToMediaItems,
  assignTagAvatarToTag,
  setEndDate,
  setStartDate,
  setViewSpecType,
  uploadTagIconFile,
  deleteTagFromMediaItems,
  setViewSpecTagSpec,
  getAppTagAvatars,
  getUserTagAvatars,
  addUserAvatar,
} from '../controllers';
import { addAppAvatars } from '../utilities/utilities';

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
    app.get('/api/v1/mediaItemsToDisplay', getMediaItemsToDisplay);
    app.get('/api/v1/tags', getTags);
    app.get('/api/v1/viewSpec', getViewSpec);
    app.get('/api/v1/appTagAvatars', getAppTagAvatars);
    app.get('/api/v1/userTagAvatars', getUserTagAvatars);

    app.post('/api/v1/addTag', addTag)
    app.post('/api/v1/addTagToMediaItems', addTagToMediaItems)
    app.post('/api/v1/deleteTagFromMediaItems', deleteTagFromMediaItems)

    app.post('/api/v1/addUserAvatar', addUserAvatar)
    app.post('/api/v1/uploadTagIconFile', uploadTagIconFile);
    app.post('/api/v1/assignTagAvatarToTag', assignTagAvatarToTag);

    app.post('/api/v1/setViewSpecType', setViewSpecType);
    app.post('/api/v1/setViewSpecTagSpec', setViewSpecTagSpec);
    app.post('/api/v1/setStartDate', setStartDate);
    app.post('/api/v1/setEndDate', setEndDate);

  }
}
