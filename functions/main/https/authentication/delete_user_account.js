const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.post("/", verifyAppCheckToken, async (request, response) => {

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
        message: null,
    };

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        responseBody.message = "User profile does not exists.";
        response.status(404).send(responseBody);
        return;
    }

    await userProfileRef
        .delete()
        .then((result) => {
            responseBody.message = "User account is deleted successfully";
            response.status(200).send(responseBody);
        })
        .catch((error) => {
            logger.error(`delete-user-account||failed||http||error is ${error.message}`);
            responseBody.message = error.message;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
