const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {logger} = require("firebase-functions");
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API get_user_private_profile started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const responseBody = {
        data: null,
        message: null,
    };

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        logger.warn(`User profile document does not exists`);
        responseBody.message = "User profile does not exists.";
        response.status(404).send(responseBody);
        return;
    }

    const userProfile = userProfileSnapshot.data();
    responseBody.data = {
        username: userProfile.username,
        profileImage: userProfile.profileImage,
        coverImage: userProfile.coverImage,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        emailAddress: userProfile.emailAddress,
        phoneNumber: userProfile.phoneNumber,
        phoneNumberPrefix: userProfile.phoneNumberPrefix,
        completePhoneNumber: userProfile.completePhoneNumber,
        userAccountId: userProfile.userAccountId,
        activityId: userProfile.activityId,
        profession: userProfile.profession,
        linkedInUsername: userProfile.linkedInUsername,
        gitHubUsername: userProfile.gitHubUsername,
        universityName: userProfile.universityName,
        createdOn: userProfile.createdOn._seconds,
        lastUpdatedOn: userProfile.createdOn._seconds,
    };
    logger.info(`User profile document read`);
    responseBody.message = "User profile fetched successfully";
    response.status(200).send(responseBody);
});

module.exports = router;
