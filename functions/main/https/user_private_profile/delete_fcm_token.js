const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API delete_fcm_token started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
    const fcmTokenRef = admin.firestore().doc(fcmTokenPath);
    const fcmTokenQuerySnapshot = await fcmTokenRef.get();

    if (fcmTokenQuerySnapshot.exists) {
        logger.info(`FCM token document about to be deleted`);
        await fcmTokenRef.delete().then((result) => {
            logger.info(`FCM token document deleted`);
            responseBody.message = `Successfully deleted the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`FCM token document could not be deleted. Error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    } else {
        logger.warn(`FCM token document does not exists`);
    }
});

module.exports = router;
