const admin = require("firebase-admin");
const serviceAccount = require("./service_account_key.json");
const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const { setGlobalOptions } = require("firebase-functions/v2");
const express = require("express");
const app = express();
app.use(cors({ origin: true }));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "android-now-14",
  });
}

//http functions
const welcome = require("./main/https/landing/welcome");
app.use("/", welcome);
const sendOtpToPhoneNumber = require("./main/https/verification/send_otp_to_phone_number");
app.use("/verification/phone-number/send-otp", sendOtpToPhoneNumber);
const verifyPhoneNumberOtp = require("./main/https/verification/verify_phone_number_otp");
app.use("/verification/phone-number/verify-otp", verifyPhoneNumberOtp);
const generateCustomSignInToken = require("./main/https/authentication/generate_custom_sign_in_token");
app.use("/user/sign-in", generateCustomSignInToken);
const updateUserPrivateProfileBasicDetails = require("./main/https/user_private_profile/update_user_private_profile_basic_details");
app.use(
  "/user/profile/update/basic-details",
  updateUserPrivateProfileBasicDetails,
);
const getUserPrivateProfile = require("./main/https/user_private_profile/get_user_private_profile");
app.use("/user/profile", getUserPrivateProfile);
const updateUserPrivateProfile = require("./main/https/user_private_profile/update_user_private_profile");
app.use("/user/profile/update", updateUserPrivateProfile);
const sendVerificationLinkToPrimaryMail = require("./main/https/verification/send_verification_link_to_primary_mail");
app.use(
  "/verification/primary-mail/send-verification-link",
  sendVerificationLinkToPrimaryMail,
);
const verifyPrimaryMail = require("./main/https/verification/verify_primary_mail");
app.use("/verification/primary-mail/verify-link", verifyPrimaryMail);
const getSingleDeviceLogin = require("./main/https/authentication/get_single_device_login");
app.use("/user/single-device-login", getSingleDeviceLogin);
const getProfessionAdapterList = require("./main/https/utility/get_profession_adapter_list");
app.use("/utility/professions", getProfessionAdapterList);
const postFeedback = require("./main/https/feedback_n_support/post_feedback");
app.use("/app/feedback", postFeedback);
const getIssueCategoryAdapterList = require("./main/https/utility/get_issue_category_adapter_list");
app.use("/utility/issue-categories", getIssueCategoryAdapterList);
const requestSupport = require("./main/https/feedback_n_support/request_support");
app.use("/app/contact-support", requestSupport);

setGlobalOptions({ maxInstances: 10 });
exports.androidnow = onRequest(app);

//database triggers
const onUserProfileUpdated = require("./main/triggers/on_user_profile_updated");
exports.onUserProfileUpdated = onUserProfileUpdated;
