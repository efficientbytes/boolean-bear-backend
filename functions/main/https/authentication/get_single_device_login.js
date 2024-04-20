const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
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
        deviceId: null,
        createdOn: null,
        message: null,
    };

    const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        responseBody.deviceId = null;
        responseBody.createdOn = null;
        responseBody.message = "User profile does not exists.";
        response.status(404).send(responseBody);
        return;
    }

    const singleDeviceLoginPath = `/SINGLE_DEVICE_LOGIN/${userAccountId}`;
    const singleDeviceLoginRef = admin.firestore().doc(singleDeviceLoginPath);
    const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

    if (!singleDeviceLoginSnapshot.exists) {
        responseBody.deviceId = null;
        responseBody.createdOn = null;
        responseBody.message = `Could not find device login records`;
        response.status(400).send(responseBody);
        return;
    }
    const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

    responseBody.deviceId = singleDeviceLoginData.deviceId;
    responseBody.createdOn = singleDeviceLoginData.createdOn._seconds;
    responseBody.message = null;

    response.status(200).send(responseBody);
});

module.exports = router;
