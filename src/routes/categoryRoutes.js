import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import * as c from '../controllers/categoryController.js';

const router = Router();

router.get('/', c.listCategories);
router.get('/:id', validateId, c.getCategory);
router.post('/', validate('category'), c.createCategory);
router.patch('/:id', validateId, validate('category'), c.updateCategory);
router.delete('/:id', validateId, c.deleteCategory);
router.get('/:id/products', validateId, c.listCategoryProducts);

export default router;
