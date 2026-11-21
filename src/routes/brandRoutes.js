import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import * as c from '../controllers/brandController.js';

const router = Router();

router.get('/', c.listBrands);
router.get('/:id', validateId, c.getBrand);
router.post('/', validate('brand'), c.createBrand);
router.patch('/:id', validateId, validate('brand'), c.updateBrand);
router.delete('/:id', validateId, c.deleteBrand);
router.get('/:id/products', validateId, c.listBrandProducts);

export default router;
