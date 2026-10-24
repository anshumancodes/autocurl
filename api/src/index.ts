import { createApp } from './app.js';
import { validateServerEnv } from './lib/config.js';

validateServerEnv();
const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
createApp().listen(port, () => console.log(`autocurl API listening on ${port}`));
