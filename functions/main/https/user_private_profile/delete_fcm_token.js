const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const userAccountId = request.userAccountId;
    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
    const fcmTokenRef = admin.firestore().doc(fcmTokenPath);

    const fcmTokenQuerySnapshot = await fcmTokenRef.get();

    if (fcmTokenQuerySnapshot.exists) {

        await fcmTokenRef.delete().then((result) => {
            responseBody.message = `Successfully deleted the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`delete-fcm-token||failed||http||error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    }
});

module.exports = router;
