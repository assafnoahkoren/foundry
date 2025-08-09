import { router } from '../../trpc';
import { joniCommBlockRouter } from './joni-comm-block.router';
import { joniTransmissionRouter } from './joni-transmission.router';
import { joniScriptRouter } from './joni-script.router';
import { joniCommProgressRouter } from './joni-comm-progress.router';

// Parent router that combines all comm-block related routers
export const joniCommRouter = router({
  blocks: joniCommBlockRouter,
  transmissions: joniTransmissionRouter,
  scripts: joniScriptRouter,
  progress: joniCommProgressRouter
});