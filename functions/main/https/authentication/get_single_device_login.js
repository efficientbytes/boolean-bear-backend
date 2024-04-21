const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
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
        data: null,
        message: null,
    };

    responseBody.data = {
        deviceId: null,
        createdOn: null,
    }

    const singleDeviceLoginPath = `/SINGLE-DEVICE-LOGIN/${userAccountId}`;
    const singleDeviceLoginRef = admin.firestore().doc(singleDeviceLoginPath);
    const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

    if (!singleDeviceLoginSnapshot.exists) {
        responseBody.message = `Could not find device login records`;
        response.status(404).send(responseBody);
        return;
    }
    const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

    responseBody.data.deviceId = singleDeviceLoginData.deviceId;
    responseBody.data.createdOn = singleDeviceLoginData.createdOn._seconds;

    responseBody.message = `Successfully fetched single device login.`;
    response.status(200).send(responseBody);
});

module.exports = router;
