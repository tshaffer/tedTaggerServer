import express from 'express';
import cors from 'cors';
import connectDB from './config/db';

import { readConfig } from './config';

const bodyParser = require('body-parser');

import { Routes } from './routes/routes';

import {
  addTag,
  getMediaItems,
  getTags,
  getVersion,
  addTagToMediaItem,
  addTagToMediaItems,
  uploadTagIconFile,
  assignTagIconToTag,
} from './controllers';

class App {

  public app: express.Application;
  public route: Routes = new Routes();

  constructor() {

    console.log('app.ts constructor invoked');

    console.log('readConfig');

    try {
      readConfig('/Users/tedshaffer/Documents/Projects/tedTaggerServer/src/config/config.env');
    } catch (err: any) {
      console.log('readConfig error');
    }

    console.log('port environment variable: ', process.env.PORT);
    console.log('mongo environment variable: ', process.env.MONGO_URI);

    connectDB();

    this.app = express();
    this.config();

    this.app.use(express.static('public'))
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.route.routes(this.app);

    // app routes
    this.app.get('/api/v1/version', getVersion);
    this.app.get('/api/v1/mediaItems', getMediaItems);
    this.app.get('/api/v1/tags', getTags);

    this.app.post('/api/v1/addTag', addTag)
    this.app.post('/api/v1/addTagToMediaItem', addTagToMediaItem)
    this.app.post('/api/v1/addTagToMediaItems', addTagToMediaItems)
    this.app.post('/api/v1/uploadTagIconFile', uploadTagIconFile);
    this.app.post('/api/v1/assignTagIconToTag', assignTagIconToTag);

  }

  private config(): void {
    let port: any = process.env.PORT;
    if (port === undefined || port === null || port === '') {
      port = 8888;
    }
    this.app.set('port', port);
  }
}

export default new App().app;
