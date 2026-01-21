import { Router } from 'express';
import * as controller from './controller';

const router = Router();

router.post('/execute', controller.execute);

export default router;
