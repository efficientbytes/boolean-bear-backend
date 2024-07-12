const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API update_user_private_profile started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const username = request.body.username || null;
    logger.info(`Username is ${username}`);
    const firstName = request.body.firstName || null;
    logger.info(`First name is ${firstName}`);
    const lastName = request.body.lastName || null;
    logger.info(`Last name is ${lastName}`);
    const emailAddress = request.body.emailAddress || null;
    logger.info(`Email address is ${emailAddress}`);
    const profession = request.body.profession || 0;
    logger.info(`Profession is ${profession}`);
    const linkedInUsername = request.body.linkedInUsername || null;
    logger.info(`LinkedIn username is ${linkedInUsername}`);
    const gitHubUsername = request.body.gitHubUsername || null;
    logger.info(`Github username is ${gitHubUsername}`);
    const universityName = request.body.universityName || null;
    logger.info(`University name is ${universityName}`);

    const responseBody = {
        data: null,
        message: null,
    };

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);

    logger.info(`User profile document about to be updated`);
    await userProfileRef
        .update({
            username: username,
            firstName: firstName,
            lastName: lastName,
            emailAddress: emailAddress,
            profession: profession,
            universityName: universityName,
            linkedInUsername: linkedInUsername,
            gitHubUsername: gitHubUsername,
        })
        .then((result) => {
            logger.info(`User profile document updated`);
            responseBody.message = "User profile has been updated.";
        })
        .catch((error) => {
            logger.error(`User profile document could not be updated. Error is ${error.message}`);
            responseBody.message = `User profile could not be updated. Error is ${error.message}`;
            response.status(500).send(responseBody);
        });

    const updatedUserProfileSnapshot = await userProfileRef.get();
    const userProfile = updatedUserProfileSnapshot.data();

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
    response.status(200).send(responseBody);
});

module.exports = router;
