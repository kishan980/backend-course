import express from 'express';
import { authorizeAdmin, isAuthenticated,authorizeSubscriber } from '../middlewares/auth.js';
import singleUpload from '../middlewares/multer.js';
import {
  getAllCourse,
  createCourse,
  getCourseLectures,
  addLecture,
  deleteCourse,
  deleteLecture
} from './../controllers/courseController.js';

const router = express.Router();

router.route('/courses').get(getAllCourse);
router
  .route('/createCourse')
  .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);
router
  .route('/course/:id')
  .get(isAuthenticated,authorizeSubscriber,getCourseLectures)
  .post(isAuthenticated,authorizeAdmin,singleUpload, addLecture).delete(deleteCourse)

  router.route("/lecture").delete(isAuthenticated,authorizeAdmin,deleteLecture)

export default router;
