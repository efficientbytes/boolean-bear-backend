const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const userAccountId = request.userAccountId;
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
        responseBody.message = `Successfully fetched course under waiting list.`;
        responseBody.data = courseList;
        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
