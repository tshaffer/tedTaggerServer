import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const KeywordNodeSchema = new Schema(
  {
    nodeId: { type: String, required: true, unique: true },
    keywordId: { type: String, required: true, unique: true },
    parentNodeId: { type: String, required: true, unique: true },
    childrenNodeIds: { type: String, required: true, unique: true },
  }
);

export const getKeywordNodeModel = () => {
  const keywordNodeModel = connection.model('keywordnode', KeywordNodeSchema);
  return keywordNodeModel;
}

export default KeywordNodeSchema;
