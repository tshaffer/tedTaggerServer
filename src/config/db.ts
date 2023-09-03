import mongoose from 'mongoose';

export let connection: mongoose.Connection;

import { tedTaggerConfiguration } from './config';

async function connectDB() {

  console.log('mongo uri is:');
  console.log(tedTaggerConfiguration.MONGO_URI);
  connection = await mongoose.createConnection(tedTaggerConfiguration.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  console.log(`MongoDB new db connected`);

  mongoose.Promise = global.Promise;
};

export default connectDB;
