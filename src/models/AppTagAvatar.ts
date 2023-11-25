import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const AppTagAvatarSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true, unique: true },
    pathToLarge: { type: String, required: true, unique: true },
    path: { type: String, required: true, unique: true },
  }
);

export const getAppTagAvatarModel = () => {
  const tagModel = connection.model('apptagavatar', AppTagAvatarSchema);
  return tagModel;
}

export default AppTagAvatarSchema;
