const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.post("/", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Authentication required.`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

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
