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
