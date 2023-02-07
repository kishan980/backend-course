import { Course } from './../models/Courses.js';
import { catchAsyncError } from './../middlewares/catchAsyncErrors.js';
import ErrorHandlerUtils from './../utils/ErrorHandlerUtils';
import getDataUri from '../utils/dataUri.js';
import cloudinary from 'cloudinary';
import { State } from './../models/State.js';

export const getAllCourse = catchAsyncError(async (req, res) => {

  const keyword = req.query || "";
  const category = req.query||"";


  const course = await Course.find({
    title:{
      $regex:keyword,
      $options:"i"
    },
    category:{
        $regex:category,
        $options:"i"
    }
  }).select('-lectures');
  if (course.length > 0) {
    return res.status(200).json({
      success: true,
      course,
    });
  } else {
    return res.status(200).json({
      success: false,
      message: 'not found',
    });
  }
});

export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;
  if (!title || !description || !category || !createdBy)
    return next(new ErrorHandlerUtils('Please enter all filed', 400));
  const file = req.file;
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  return res.status(201).json({
    success: true,
    message: 'post create successfully. You can add lectures now.',
  });
});

export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ErrorHandlerUtils('Course not found', 404));
  course.views += 1;
  await course.save();
  return res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

export const addLecture = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!title || !description)
    return next(new ErrorHandlerUtils('please enter the all filed', 400));
  const course = await Course.findById(id);
  if (!course) return next(new ErrorHandlerUtils('Course not found', 404));
  const file = req.file;
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: 'video',
  });
  course.lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  course.numOfVideos = course.lectures.length;
  await course.save();
  return res.status(200).json({
    success: true,
    message: 'Lecture added in course',
  });
});

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) return next(new ErrorHandlerUtils('Course not found', 404));

  await cloudinary.v2.uploader.destroy(course.poster.public_id);
  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: 'video',
    });
  }
  await course.remove();
  res.status(200).json({
    success: true,
    message: 'Course delete successfully',
  });
});

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandlerUtils('Course not found', 404));

  const lecture = course.lectures.find(item => {
    if (item._id.toString() === lectureId.toString()) return item;
  });

  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: 'video',
  });

  course.lectures = course.lectures.filter(item => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });
  course.numOfVideos = course.lectures.length;
  await course.save();

  return res.status(200).json({
    success: true,
    message: 'Lecture delete successfully',
  });
});


Course.watch().on("change", async ()=>{
  const state = await State.find({}).sort({createdAt:"desc"}).limit(1)
  const courses = await Course.find({})

  let totalViews =0
  for(let index=0; index<courses.length; index++){
    totalViews += courses[index].views;
  }

  state[0].views =totalViews;
  state[0].createdAt= new Date(Date.now());
  await state[0].save()
})