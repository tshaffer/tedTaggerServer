import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

import { 
  PhotosToDisplaySpec, 
 } from '../types';
import { createPhotosToDisplaySpecDocument } from "../controllers";
import { isNil } from 'lodash';

export const createPhotosToDisplaySpec = async (request: Request, response: Response, next: any) => {
  const photosToDisplaySpec: PhotosToDisplaySpec = {
    specifyDateRange: false,
  };
  await createPhotosToDisplaySpecDocument(photosToDisplaySpec);
  response.sendStatus(200);
};

export const valueOrNull = (possibleValue: any, convertToNumber: boolean = false): any | null => {
  if (isNil(possibleValue)) {
    return null;
  }
  if (convertToNumber) {
    possibleValue = parseInt(possibleValue);
  }
  return possibleValue;
}

