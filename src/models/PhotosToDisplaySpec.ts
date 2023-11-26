import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const PhotosToDisplaySpecSchema = new Schema(
  {
    dateSelector: { type: String, required: true, unique: true },
    tagSelector: { type: String, required: true, unique: true },
    startDate: { type: String, required: true, unique: true },
    endDate: { type: String, required: true, unique: true },
  }
);

export const getPhotosToDisplaySpecModel = () => {
  const photosToDisplaySpecModel = connection.model('photostodisplayspec', PhotosToDisplaySpecSchema);
  return photosToDisplaySpecModel;
}

export default PhotosToDisplaySpecSchema;
