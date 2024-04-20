const admin = require("firebase-admin");
const express = require("express");
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
            responseBody.message = error.message;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
