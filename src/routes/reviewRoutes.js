import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import * as c from '../controllers/reviewController.js';

const router = Router();

router.patch('/:id', validateId, validate('reviewUpdate'), c.updateReview);
router.delete('/:id', validateId, c.deleteReview);

export default router;
