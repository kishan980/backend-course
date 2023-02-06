import express from "express";
import { buySubscription, paymentVerification,getRazorPayKey, cancelSubScription } from "../controllers/paymentController.js";
import { isAuthenticated } from './../middlewares/auth.js';
const router = express.Router()

router.route("/subscribe").get(isAuthenticated,buySubscription);
router.route("/payment-verification").post(isAuthenticated,paymentVerification)
router.route("/razorpaykey").get(getRazorPayKey);
router.route("/cancel-subscription").get(isAuthenticated,cancelSubScription)
export default router;