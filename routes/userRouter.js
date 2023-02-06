import express from 'express';
import {
  register,
  login,
  logout,
  getMyProfile,
  ChangePassword,
  ProfileUpdate,
  updateProfilePicture,
  forgotPassword,
  resetPassword,
  addFormPlaylist,
  removeFormPlaylist,
  getAllUser,
  roleUpdate,
  deleteUser,
  deleteMyProfile
} from '../controllers/userController.js';
import { authorizeAdmin, isAuthenticated } from './../middlewares/auth.js';
import singleUpload from './../middlewares/multer.js';

const router = express.Router();

router.route('/register').post(singleUpload, register);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/me').get(isAuthenticated, getMyProfile);
router.route('/delete-profile').delete(isAuthenticated, deleteMyProfile);
router.route('/change-password').put(isAuthenticated, ChangePassword);
router.route('/updateProfile').put(isAuthenticated, ProfileUpdate);
router
  .route('/updateProfilePicture')
  .put(singleUpload, isAuthenticated, updateProfilePicture);
router.route('/forget-password').post(forgotPassword);
router.route('/reset-password/:token').put(isAuthenticated, resetPassword);
router.route('/addFormPlaylist').post(isAuthenticated, addFormPlaylist);
router.route('/removeFormPlaylist').delete(isAuthenticated, removeFormPlaylist);

//admin site routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin,getAllUser)
router.route("/admin/user/:id").put(isAuthenticated,authorizeAdmin,roleUpdate).delete(deleteUser)
export default router;
