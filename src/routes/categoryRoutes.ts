import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory, upload, validateCategory
} from '../controllers/categoryController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';

export const categoryRouter = (io: any) => {
  const router = Router();

  // Public: get all categories
  router.get('/', getCategories);

  // Admin only: create category with image upload
  router.post(
    '/',
    authMiddleware,
    adminMiddleware,
    upload.single('image'),       // Image upload
    validateCategory,             // Validate request body
    (req, res) => createCategory(req, res, io)
  );

  // Admin only: update category
  router.put(
    '/:id',
    authMiddleware,
    adminMiddleware,
    upload.single('image'),       // Optional new image
    validateCategory,
    (req, res) => updateCategory(req, res, io)
  );

  // Admin only: delete category
  router.delete(
    '/:id',
    authMiddleware,
    adminMiddleware,
    (req, res) => deleteCategory(req, res, io)
  );

  return router;
};
