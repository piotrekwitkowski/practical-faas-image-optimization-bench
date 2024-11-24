import { http } from '@google-cloud/functions-framework';
import { readdirSync } from 'fs';

http('main', (req, res) => {
  console.log('dirname:' + import.meta.dirname);
//   const dirs = ['/', '/workspace', '/workspace/node_modules', '/workspace/node_modules/@img'];
  const dirs = ['/workspace/node_modules/@img'];

  let response = '';
  for (const dir of dirs) {
    try {
      const files = readdirSync(dir);
      response += `Contents of ${dir}: ${files.join(', ')}\n\n`;
    } catch (error) {
      response += `Error reading ${dir}: ${error.message}\n\n`;
    }
  }

  res.send(response);
});
