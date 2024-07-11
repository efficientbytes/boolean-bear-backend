const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const userAccountId = request.userAccountId;
    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        deviceId: null,
        createdOn: null,
    }

    const singleDeviceLoginPath = `/USERS/SINGLE-DEVICE-TOKENS/FILES/${userAccountId}`;
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
