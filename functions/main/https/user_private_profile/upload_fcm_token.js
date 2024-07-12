const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API upload_fmc_token started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const token = request.body.token || null;
    logger.info(`FCM token is ${token}`);
    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    const time = admin.firestore.FieldValue.serverTimestamp();
    const createdOn = time;
    const updatedOn = time;

    if (token == null) {
        logger.warn(`FCM token not supplied`);
        responseBody.message = `Token is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
    const fcmTokenRef = admin.firestore().doc(fcmTokenPath);
    const fcmTokenQuerySnapshot = await fcmTokenRef.get();

    if (fcmTokenQuerySnapshot.exists) {
        logger.info(`FCM document exists`);
        logger.info(`FCM document about to be updated`);
        await fcmTokenRef.update({
            token: token,
            userAccountId: userAccountId,
            updatedOn: updatedOn
        }).then((result) => {
            logger.info(`FCM document updated`);
            responseBody.remoteNotificationToken = {
                token: token,
                userAccountId: null
            }
            responseBody.message = `Successfully updated the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`FCM document could not be updated. Error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    } else {
        logger.info(`FCM document does not exists`);
        logger.info(`FCM document about to be created`);
        await fcmTokenRef.set({
            token: token,
            userAccountId: userAccountId,
            updatedOn: updatedOn,
            createdOn: createdOn
        }).then((result) => {
            logger.info(`FCM document created`);
            responseBody.remoteNotificationToken = {
                token: token,
                userAccountId: null
            }
            responseBody.message = `Successfully created the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            logger.error(`FCM document could not be created. Error is ${error.message}`);
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    }
});

module.exports = router;
