import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import * as c from '../controllers/productController.js';

const router = Router();

router.get('/', c.listProducts);
router.get('/:id', validateId, c.getProduct);
router.post('/', validate('product'), c.createProduct);
router.patch('/:id', validateId, validate('product'), c.updateProduct);
router.delete('/:id', validateId, c.deleteProduct);
router.get('/:id/reviews', validateId, c.listProductReviews);
router.post('/:id/reviews', validateId, validate('review'), c.createProductReview);

export default router;
