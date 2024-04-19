const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {
    logger.log(`http||upload-fcm-token.`);

    const token = request.body.token || null;
    const userAccountId = request.body.userAccountId || null;

    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    const time = admin.firestore.FieldValue.serverTimestamp();
    const createdOn = time;
    const updatedOn = time;

    if (userAccountId == null) {
        logger.error(`User account id is not provided.`);

        responseBody.message = `User account id is not provided.`;
        response.status(401).send(responseBody);
        return;
    }

    if (token == null) {
        logger.error(`Token is not provided.`);

        responseBody.message = `Token is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const fcmTokenPath = `/FCM-TOKEN/${userAccountId}`;
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
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    }
});

module.exports = router;
