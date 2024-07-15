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

//user profile
const getUserPrivateProfile = require("./main/https/user_private_profile/get_user_private_profile");
app.use("/user/account/profile", getUserPrivateProfile);
const updateUserPrivateProfileBasicDetails = require("./main/https/user_private_profile/update_user_private_profile_basic_details");
app.use(
    "/user/account/profile/basic-details/update",
    updateUserPrivateProfileBasicDetails,
);
const updateUserPrivateProfile = require("./main/https/user_private_profile/update_user_private_profile");
app.use("/user/account/profile/update", updateUserPrivateProfile);
const deleteUserProfile = require("./main/https/authentication/delete_user_account");
app.use("/user/account/delete", deleteUserProfile);

//instructor profile
const uploadInstructorProfile = require("./main/https/instructor/upload_instructor_profile");
app.use("/admin/instructor/upload-profile", uploadInstructorProfile);
const getInstructorProfile = require("./main/https/instructor/get_instructor_profile");
app.use("/instructors/profile", getInstructorProfile);

//utility
const getProfessionAdapterList = require("./main/https/utility/get_profession_adapter_list");
app.use("/utility/professions", getProfessionAdapterList);
const getIssueCategoryAdapterList = require("./main/https/utility/get_issue_category_adapter_list");
app.use("/utility/issue-categories", getIssueCategoryAdapterList);

//contact support and feedback
const postFeedback = require("./main/https/feedback_n_support/post_feedback");
app.use("/app/feedback", postFeedback);
const requestSupport = require("./main/https/feedback_n_support/request_support");
app.use("/app/contact-support", requestSupport);

//mentioned links
const getMentionedLink = require("./main/https/links/get_mentioned_link");
app.use("/mentioned-links", getMentionedLink);

//analytics
const increaseContentViews = require("./main/https/statistics/increase_content_views");
app.use("/statistics/content-views/app", increaseContentViews);

//reels related
const getAllReelTopics = require("./main/https/reels/get_all_reel_topics");
app.use("/reels/topics", getAllReelTopics);
const getReelsForTopic = require("./main/https/reels/get_reels_for_topic");
app.use("/reels/topics", getReelsForTopic);
const getReelTopicDetails = require("./main/https/reels/get_reel_topic_detail");
app.use("/reels/topics", getReelTopicDetails);
const getReelDetails = require("./main/https/reels/get_reel_details");
app.use("/reels", getReelDetails);
const getReelPlayLink = require("./main/https/reels/get_reel_play_link");
app.use("/reels", getReelPlayLink);

//course related
const getCourseBundle = require("./main/https/courses/get_course_bundle");
app.use("/courses/course-bundle", getCourseBundle);
const joinCourseWaitingList = require("./main/https/courses/join_course_waiting_list");
app.use("/courses/", joinCourseWaitingList);
const getWaitingListCourses = require("./main/https/courses/get_waiting_list_courses");
app.use("/user/courses/waiting-list", getWaitingListCourses);

//phone-verification
const sendOtpToPhoneNumber = require("./main/https/verification/send_otp_to_phone_number");
app.use("/verification/phone-number/send-otp", sendOtpToPhoneNumber);
const verifyPhoneNumberOtp = require("./main/https/verification/verify_phone_number_otp");
app.use("/verification/phone-number/verify-otp", verifyPhoneNumberOtp);

//mail verification
const sendVerificationLinkToPrimaryMail = require("./main/https/verification/send_verification_link_to_primary_mail");
app.use(
    "/verification/primary-mail/send-verification-link",
    sendVerificationLinkToPrimaryMail,
);
const verifyPrimaryMail = require("./main/https/verification/verify_primary_mail");
app.use("/verification/primary-mail/verify-link", verifyPrimaryMail);

//authentication
const getModeOfLogin = require("./main/https/verification/get_mode_of_login");
app.use("/verification/login-mode", getModeOfLogin);
const generateCustomSignInToken = require("./main/https/authentication/generate_custom_sign_in_token");
app.use("/user/sign-in", generateCustomSignInToken);
const createAccountPassword = require("./main/https/authentication/create_account_password");
app.use("/user/account/password/create", createAccountPassword);
const updateAccountPassword = require("./main/https/authentication/update_account_password");
app.use("/user/account/password/update", updateAccountPassword);
const passwordAuthentication = require("./main/https/authentication/password_authentication");
app.use("/user/sign-in/password", passwordAuthentication);
const getSingleDeviceLogin = require("./main/https/authentication/get_single_device_login");
app.use("/user/account/single-device-login", getSingleDeviceLogin);
const uploadFCMToken = require("./main/https/user_private_profile/upload_fcm_token");
app.use("/user/notifications/token/upload", uploadFCMToken);
const deleteFCMToken = require("./main/https/user_private_profile/delete_fcm_token");
app.use("/user/notification/token/delete", deleteFCMToken);
const deleteAccountAppLink = require("./main/https/app_link/delete_account_app_link");
app.use("/account/delete/", deleteAccountAppLink);

//app link for deep link
const appLinks = require("./main/https/app_link/app_link_verifications");
app.use("/.well-known/assetlinks.json", appLinks);
const adsText = require("./main/https/app_link/ads_text.js");
app.use("/app-ads.txt", adsText);
/*const landing = require("./main/https/app_link/landing");
app.use("/", landing);*/


//admin
const uploadVideo = require("./main/https/videos/upload_video");
app.use("/admin/video/upload", uploadVideo);
const createTopics = require("./main/https/courses/create_topics");
app.use("/admin/contents/topics/upload", createTopics);
const createCourses = require("./main/https/courses/create_courses");
app.use("/admin/contents/topics/courses/upload", createCourses);
const createReelTemplates = require("./main/https/reels/create_reel_templates");
app.use("/admin/reels/templates/create", createReelTemplates);
const createMentionedLinkTemplates = require("./main/https/links/create_mentioned_link_templates");
app.use("/admin/mentioned-links/templates/create", createMentionedLinkTemplates);

app.use((req, res, next) => {
    res.redirect('https://play.google.com/store/apps/details?id=app.efficientbytes.booleanbear');
});

setGlobalOptions({maxInstances: 10});
exports.booleanbear = onRequest(app);

//database triggers
const onUserProfileUpdated = require("./main/triggers/on_user_profile_updated");
exports.onUserProfileUpdated = onUserProfileUpdated;
const onUserProfileDeleted = require("./main/triggers/on_user_profile_deleted");
exports.onUserProfileDeleted = onUserProfileDeleted;
const onUserJoinedCourseWaitingList = require("./main/triggers/on_user_registered_course_waiting_list");
exports.onUserJoinedCourseWaitingList = onUserJoinedCourseWaitingList;
