import ErrorHandlerUtils from './../utils/ErrorHandlerUtils';
import { catchAsyncError } from '../middlewares/catchAsyncErrors.js';
import { User } from '../models/User.js';
import { instance } from '../server.js';
import crypto from 'crypto';
import { payment } from '../models/payment.js';

export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.role === 'admin')
    return next(new ErrorHandlerUtils("Admin  can't  buy subscription", 400));

  const plan_id = process.env.PLAN_ID || 'plan_LBTi6qXreXzSik';
  const subscriptions = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    quantity: 5,
    total_count: 12,
  });

  user.subscription.id = subscriptions.id;
  user.subscription.status = subscriptions.status;
  await user.save();
  return res.status(201).json({
    success: true,
    message: 'Subscription successfully',
    subscriptions,
  });
});

export const paymentVerification = catchAsyncError(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);
  const subscription_id = user.subscription.id;
  const generate_signature = crypto
    .createHmac('sha256', process.env.RAZOR_API_SECRET)
    .update(razorpay_payment_id + '|' + subscription_id, 'utf-8')
    .digest('hex');

  const isAuthenticated = generate_signature === razorpay_signature;
  if (!isAuthenticated)
    return res.status(`${process.env.FRONTEND_URL}/paymentfailed`);

  await payment.create({
    razorpay_payment_id,
    razorpay_signature,
    razorpay_subscription_id,
  });
  user.subscription.status = 'active';
  await user.save();
  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess>reference=${razorpay_payment_id}`
  );
});

export const getRazorPayKey = catchAsyncError(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    key: process.env.RAZOR_API_KEY,
  });
});

export const cancelSubScription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscriptionId = user.subscription.id;
  let refund = false;
  await instance.subscriptions.cancel(subscriptionId);
  const paymentData = await payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt;
  const refundRTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
  if (refundRTime > gap) {
    await instance.payments.refund(paymentData.razorpay_payment_id);
    refund = true
  }

  await payment.remove()
  user.subscription.id = undefined;
  user.subscription.status = undefined
  await user.save()

  return res.status(200).json({
    success: true,
    message: refund
      ? 'Subscription cancelled, you will receive full refund withing 7 days.'
      : 'Subscription cancelled, Now refund initialed as subscription was cancelled after 7 days.',
  });
});
