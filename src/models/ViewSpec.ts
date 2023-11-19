import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const ViewSpecSchema = new Schema(
  {
    type: { type: Number, required: true, unique: true },
    tagSpec: { type: String, required: true, unique: true },
    startDate: { type: String, required: true, unique: true },
    endDate: { type: String, required: true, unique: true },
  }
);

export const getViewSpecModel = () => {
  const viewSpecModel = connection.model('viewspec', ViewSpecSchema);
  return viewSpecModel;
}

export default ViewSpecSchema;
