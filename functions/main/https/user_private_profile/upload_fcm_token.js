const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const userAccountId = request.userAccountId;
    const token = request.body.token || null;

    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    const time = admin.firestore.FieldValue.serverTimestamp();
    const createdOn = time;
    const updatedOn = time;

    if (token == null) {
        responseBody.message = `Token is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
    const fcmTokenRef = admin.firestore().doc(fcmTokenPath);

    const fcmTokenQuerySnapshot = await fcmTokenRef.get();

    if (fcmTokenQuerySnapshot.exists) {

        await fcmTokenRef.update({
            token: token,
            userAccountId: userAccountId,
            updatedOn: updatedOn
        }).then((result) => {
            responseBody.remoteNotificationToken = {
                token: token,
                userAccountId: null
            }
            responseBody.message = `Successfully updated the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`upload-fcm-token||failed||http||error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    } else {

        await fcmTokenRef.set({
            token: token,
            userAccountId: userAccountId,
            updatedOn: updatedOn,
            createdOn: createdOn
        }).then((result) => {
            responseBody.remoteNotificationToken = {
                token: token,
                userAccountId: null
            }
            responseBody.message = `Successfully created the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`upload-fcm-token||failed||http||error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    }
});

module.exports = router;
