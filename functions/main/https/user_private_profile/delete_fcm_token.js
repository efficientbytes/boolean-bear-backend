const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {
    logger.log(`http||delete-fcm-token.`);

    const userAccountId = request.body.userAccountId || null;

    const responseBody = {
        remoteNotificationToken: null,
        message: null
    }

    if (userAccountId == null) {
        logger.error(`User account id is not provided.`);

        responseBody.message = `User account id is not provided.`;
        response.status(401).send(responseBody);
        return;
    }

    const fcmTokenPath = `/FCM-TOKEN/${userAccountId}`;
    const fcmTokenRef = admin.firestore().doc(fcmTokenPath);

    const fcmTokenQuerySnapshot = await fcmTokenRef.get();

    if (fcmTokenQuerySnapshot.exists) {

        await fcmTokenRef.delete().then((result) => {
            responseBody.message = `Successfully deleted the token`;
            response.status(200).send(responseBody);
        }).catch((error) => {
            responseBody.message = error.message
            response.status(500).send(responseBody);
        });

    }
});

module.exports = router;
