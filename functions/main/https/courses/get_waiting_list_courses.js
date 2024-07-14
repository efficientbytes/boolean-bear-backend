const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");
const {logger} = require("firebase-functions");

router.get("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API get_course_waiting_list started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const responseBody = {
        data: null,
        message: null
    }

    const userPrivateProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userPrivateProfileRef = admin.firestore().doc(userPrivateProfilePath);
    const userPrivateProfileQueryResult = await userPrivateProfileRef.get();
    const userProfileData = userPrivateProfileQueryResult.data();

    try {
        const courseList = userProfileData.courseWaitingList;
        logger.info(`Course waiting list read`);
        responseBody.message = `Successfully fetched course under waiting list.`;
        responseBody.data = courseList;
        response.status(200).send(responseBody);
    } catch (error) {
        logger.error(`Course waiting list could not be read. Error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
