import * as dotenv from 'dotenv';
import { isNil } from 'lodash';
import { TedTaggerConfiguration } from '../types';

export let tedTaggerConfiguration: TedTaggerConfiguration; 

export const readConfig = (pathToConfigFile: string): void => {

  try {
    const configOutput: dotenv.DotenvConfigOutput = dotenv.config({ path: pathToConfigFile });
    const parsedConfig: dotenv.DotenvParseOutput | undefined = configOutput.parsed;

    if (!isNil(parsedConfig)) {
      tedTaggerConfiguration = {
        PORT: Number(parsedConfig.PORT),
        MONGO_URI: parsedConfig.MONGO_URI,
      };
      console.log(tedTaggerConfiguration);
    }
  }
  catch (err) {
    console.log('Dotenv config error: ' + err.message);
  }
};
