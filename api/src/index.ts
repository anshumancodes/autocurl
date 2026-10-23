import { createApp } from './app.js';

const port = Number(process.env.PORT || 8000);
createApp().listen(port, () => console.log(`autocurl API listening on ${port}`));
