import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const UserTagAvatarSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true, unique: true },
    path: { type: String, required: true, unique: true },
  }
);

export const getUserTagAvatarModel = () => {
  const tagModel = connection.model('usertagavatar', UserTagAvatarSchema);
  return tagModel;
}

export default UserTagAvatarSchema;
