import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { scriptV1Schema } from './schemas/scriptV1.schema';
import { normalizeScript } from './utils/normalize-script';

export const getVideoScript = () => {
  const scriptPath = path.join(process.cwd(), 'public', 'sample-video.json');
  const fileContent = fs.readFileSync(scriptPath, 'utf-8');

    // Handle case where file is empty or doesn't exist
    if (!fileContent) {
      throw new Error(`Script file is empty or not found: ${scriptPath}`);
    }

    const scriptData = JSON.parse(fileContent);
  const parsedScript = normalizeScript(scriptData);
  return parsedScript;
};

export type VideoScript = z.infer<typeof scriptV1Schema>;
