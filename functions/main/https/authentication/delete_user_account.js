const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const {error} = require("firebase-functions/logger");
const router = express.Router();

router.post("/", async (request, response) => {

    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Invalid auth token`});
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

    const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        //user does not exits
        logger.error(
            `log||user account id is ${userAccountId}. User profile does not exists.`,
        );
        responseBody.message = "User profile does not exists.";
        response.status(404).send(responseBody);
        return;
    }

    // user profile exits, so update the fields
    logger.log(`log||user account id is ${userAccountId}. User profile exists.`);

    await userProfileRef
        .delete()
        .then((result) => {
            logger.log(
                `log||user profile for user with user id ${userAccountId} is deleted.`,
            );
            responseBody.message = "User account is deleted successfully";
            response.status(200).send(responseBody);
        })
        .catch((error) => {
            logger.error(
                `log||failed to delete user profile for user with user id ${userAccountId}. Error is ${error.message}`,
            );
            responseBody.message = error.message;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
