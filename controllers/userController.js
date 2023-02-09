import {errorHandlerUtils} from '../utils/errorHandlerUtils.js';
import { catchAsyncError } from './../middlewares/catchAsyncErrors.js';
import { sendToken } from '../utils/sendTokenUtil.js';
import { User } from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import { Course } from '../models/Courses.js';
import cloudinary from 'cloudinary';
import getDataUri from '../utils/dataUri.js';
import { State } from './../models/State.js';

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;
  if (!name || !email | !password || !file)
    return next(new errorHandlerUtils('Please enter the all filed', 400));
  let user = await User.findOne({ email });
  if (user) return next(new errorHandlerUtils('User already exists', 409));
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  sendToken(res, user, 'Register successfully', 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new errorHandlerUtils('Please enter all filed', 400));

  const user = await User.findOne({ email }).select('+password');

  if (!user) return next(new errorHandlerUtils('Incorrect email', 401));

  const isMatch = await user.ComparePassword(password);

  if (!isMatch) return next(new errorHandlerUtils('Incorrect password'));

  sendToken(res, user, `Welcome back ,${user.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  return res
    .status(200)
    .cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly:true,
      secure:true,
      sameSite:"none"
    })
    .json({
      success: true,
      message: 'Logged Out successfully',
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById({ _id: req.user._id });
  return res.status(200).json({
    success: true,
    user,
  });
});

export const ChangePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(new errorHandlerUtils('Please enter all filed', 400));
  const user = await User.findById({ _id: req.user._id }).select('+password');
  const isMatch = await user.ComparePassword(oldPassword);
  if (!isMatch)
    return next(new errorHandlerUtils('Incorrect oldPassword', 400));

  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'password Change successfully',
  });
});

export const ProfileUpdate = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  if (!name || !email)
    return next(new errorHandlerUtils('Please enter the all filed'));
  const user = await User.findById({ _id: req.user._id });
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();
  return res.status(200).json({
    success: true,
    message: 'Profile update successfully',
  });
});

export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const user = await User.findById(req.user._id);
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };
  await user.save();
  return res.status(200).json({
    success: true,
    message: 'Profile Picture updated successfully',
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new errorHandlerUtils('User not found', 400));

  const resetToken = await user.getResetToken();
  await user.save();
  const url = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `click on the link to reset your password. ${url}. if you have not request then please ignore`;
  await sendEmail(user.email, 'course reset password', message);
  return res.status(200).json({
    success: true,
    message: `Reset token has been send to ${user.email}`,
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });
  if (!user)
    return next(
      new errorHandlerUtils('token is invalid and hash been expired')
    );

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();
  return res.status(200).json({
    success: true,
    message: 'password change successfully',
  });
});

export const addFormPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.body.id);
  if (!course) return next(new errorHandlerUtils('Invalid Course Id', 404));

  const itemExist = user.playlist.find(item => {
    if (item.course.toString() === course._id.toString()) return true;
  });

  if (itemExist) return next(new errorHandlerUtils('Item already exist', 409));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Added to playlist',
  });
});

export const removeFormPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.query.id);
  if (!course) return next(new errorHandlerUtils('Course Id invalid', 400));
  let newPlayList = user.playlist.filter(item => {
    if (item.course.toString() !== course._id.toString()) return item;
  });
  user.playlist = newPlayList;
  await user.save();
  return res.status(200).json({
    success: true,
    message: 'Remove Playlist',
  });
});

export const getAllUser = catchAsyncError(async (req, res, next) => {
  console.log("token response is ",res.cookie)
  const user = await User.find({});
  return res.status(200).json({
    success: true,
    user,
  });
});

export const roleUpdate = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new errorHandlerUtils('user not found', 404));
  if (user.role === 'user') user.role = 'admin';
  else user.role = 'user';
  await user.save();
  return res.status(200).json({
    success: true,
    message: 'Role updated',
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new errorHandlerUtils('User is not found', 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.remove();
  return res.status(200).json({
    success: true,
    message: 'User delete successfully ',
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.remove();
  return res
    .status(200)
    .cookie('token', null, { expires: new Date(Date.now()) })
    .json({
      success: true,
     message:"User profile successfully",
    });
});


User.watch().on("change",async ()=>{
  const state = await State.find({}).sort({createdAt:"desc"}).limit(1);
  const subscription = await User.find({
    "subscription.status":"active"
  })
  state[0].users =await User.countDocuments();
  state[0].users=await subscription.length;
  state[0].users=await new Date(Date.now());
  await state[0].save();
  
})