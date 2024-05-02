const admin = require("firebase-admin");
const serviceAccount = require("./service_account_key.json");
const {onRequest} = require("firebase-functions/v2/https");
const cors = require("cors");
const {setGlobalOptions} = require("firebase-functions/v2");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(cors({origin: true}));
app.use(bodyParser.urlencoded({extended: true}));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "boolean-bear",
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
const deleteUserProfile = require("./main/https/authentication/delete_user_account");
app.use("/user/delete-account", deleteUserProfile);
const createContentCategories = require("./main/https/content-categories/create_content_categories");
app.use("/admin/contents/categories/upload", createContentCategories);
const getCategories = require("./main/https/content-categories/get_categories");
app.use("/categories", getCategories);
const uploadVideo = require("./main/https/videos/upload_video");
app.use("/admin/video/upload", uploadVideo);
const uploadContent = require("./main/https/contents/upload_contents");
app.use("/admin/content/upload", uploadContent);
const uploadInstructorProfile = require("./main/https/instructor/upload_instructor_profile");
app.use("/admin/instructor/upload-profile", uploadInstructorProfile);
const getShuffledContentIds = require("./main/https/contents/get_shuffled_content_ids");
app.use("/categories/shuffled", getShuffledContentIds);
const getContent = require("./main/https/contents/get_content");
app.use("/contents", getContent);
const getContentPlayUrl = require("./main/https/contents/get_content_play_url");
app.use("/contents", getContentPlayUrl);
const getContentDetails = require("./main/https/contents/get_content_details");
app.use("/contents", getContentDetails);
const recordUserStartingScreenTime = require("./main/https/statistics/collect-screen-time-start-point");
app.use("/statistics/screen-timing/app", recordUserStartingScreenTime);
const getInstructorProfile = require("./main/https/instructor/get_instructor_profile");
app.use("/instructors/profile", getInstructorProfile);
const getMentionedLink = require("./main/https/links/get_mentioned_link");
app.use("/mentioned-links", getMentionedLink);
const increaseContentViews = require("./main/https/statistics/increase-content-views");
app.use("/statistics/content-views/app", increaseContentViews);
const appLinks = require("./main/https/app-link/app-link-verifications");
app.use("/.well-known/assetlinks.json", appLinks);
const uploadHomePageBanner = require("./main/https/banners/upload_home_page_banner");
app.use("/admin/ads/banner/home-page/upload", uploadHomePageBanner);
const getHomePageBanners = require("./main/https/banners/get_home_page_banners");
app.use("/ads/banners/home-page", getHomePageBanners);
const uploadFCMToken = require("./main/https/user_private_profile/upload_fcm_token");
app.use("/user/notifications/token/upload", uploadFCMToken);
const deleteFCMToken = require("./main/https/user_private_profile/delete_fcm_token");
app.use("/user/notification/token/delete", deleteFCMToken);
const deleteAccountAppLink = require("./main/https/app-link/delete-account-app-link");
app.use("/account/delete/", deleteAccountAppLink);
/*const createCuratedTopics = require("./main/https/courses/create_courses");
app.use("/admin/content/curated-topics/upload", createCuratedTopics);*/
const createTopics = require("./main/https/courses/create-topics");
app.use("/admin/content/topics/upload", createTopics);


setGlobalOptions({maxInstances: 10});
exports.booleanbear = onRequest(app);

//database triggers
const onUserProfileUpdated = require("./main/triggers/on_user_profile_updated");
exports.onUserProfileUpdated = onUserProfileUpdated;
const onUserProfileDeleted = require("./main/triggers/on_user_profile_deleted");
exports.onUserProfileDeleted = onUserProfileDeleted;
