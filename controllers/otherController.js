import { catchAsyncError } from '../middlewares/catchAsyncErrors.js';
import ErrorHandlerUtils from '../utils/errorHandlerUtils.js';
import { sendEmail } from './../utils/sendEmail.js';
import { State } from '../models/State.js';
export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return next(new ErrorHandlerUtils('Please enter all filed', 400));
  const to = process.env.MY_MAIL;
  const subject = 'contact from courseBundler';

  const text = `I am ${name} and my email is ${email}. \n${message}`;
  await sendEmail(to, subject, text);
  return res.status(200).json({
    success: true,
    message: 'Your message has been send',
  });
});

export const courseRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course)
    return next(new ErrorHandlerUtils('Please enter all filed', 400));
  const to = process.env.MY_MAIL;
  const subject = 'Request from courseBundler';

  const text = `I am ${name} and my email is ${email}. \n${course}`;
  await sendEmail(to, subject, text);
  return res.status(200).json({
    success: true,
    message: 'Request your message has been send',
  });
});

export const getDashboardState = catchAsyncError(async (req, res, next) => {
  const state = await State.find({}).sort({ createdAt: 'desc' }).limit(12);

  const stateData = [];

  for (let index = 0; index < state.length; index++) {
    stateData.push(state[index]);
  }
  const requiredSize = 12 - state.length;
  for (let index = 0; index < requiredSize; index++) {
    stateData.unshift({
      users: 0,
      subscription: 0,
      views: 0,
    });
  }
  
    const userCount = stateData[11].users;
    const subscriptionCount = stateData[11].subscription;
    const viewsCount = stateData[11].views;

  let usersPercentage = 0,
    viewsPerCentage = 0,
    subscriptionPercentage = 0;

  let usersProfit = true,
    viewProfit = true,
    subscriptionProfit = true;

    if(stateData[10].users ===0) usersPercentage = userCount*100;
    if(stateData[10].views ===0) viewsPerCentage = viewsCount*100;
    if(stateData[10].subscription ===0)  subscriptionPercentage = subscriptionCount*100
     else {
        const difference = {
            users: stateData[11].users -stateData[10].users,
            views:stateData[11].views-stateData[10].views,
            subscription:stateData[11].subscription-stateData[10].subscription

        }

        usersPercentage = (difference.users / stateData[10].users)*100;
        viewsPerCentage = (difference.views / stateData[10].views)*100;
        subscriptionPercentage = (difference.subscription /stateData[10].subscription)*100

        if(usersPercentage <0) usersProfit=false
        if(viewsPerCentage<0) viewProfit=false
        if(subscriptionPercentage<0) subscriptionProfit=false
     }

  return res.status(200).json({
    userCount,
    subscriptionCount,
    viewsCount,
    usersPercentage,
    viewsPerCentage,
    subscriptionPercentage,
    usersProfit,
    viewProfit,
    subscriptionProfit
  });
});
