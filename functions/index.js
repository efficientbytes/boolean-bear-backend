const admin = require("firebase-admin");
const serviceAccount = require("./service_account_key.json");
const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const logger = require("firebase-functions/logger");
const { setGlobalOptions } = require("firebase-functions/v2");
const express = require("express");
const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "android-now-14",
});

//http functions
const welcome = require("./main/https/landing/welcome");
app.use("/", welcome);
const sendOtpToPhoneNumber = require("./main/https/verification/send_otp_to_phone_number");
app.use("/verification/phone-number/send-otp", sendOtpToPhoneNumber);
const verifyPhoneNumberOtp = require("./main/https/verification/verify_phone_number_otp");
app.use("/verification/phone-number/verify-otp", verifyPhoneNumberOtp);

setGlobalOptions({ maxInstances: 10 });
exports.androidnow = onRequest(app);
