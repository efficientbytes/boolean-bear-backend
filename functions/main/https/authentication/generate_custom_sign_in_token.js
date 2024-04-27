const express = require("express");
const router = express.Router();
const {v4: uuidv4} = require("uuid");
const admin = require("firebase-admin");
router.post("/", async (request, response) => {
    const phoneNumber = request.body.phoneNumber || null;
    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        userAccountId: null,
        singleDeviceLogin: null,
        basicProfileDetailsUpdated: false,
        token: null,
    }

    responseBody.data.singleDeviceLogin = {
        deviceId: null,
        createdOn: null,
    }

    if (phoneNumber == null) {
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/`;
    const userProfileQueryResult = await admin
        .firestore()
        .collection(userProfilePath)
        .where("phoneNumber", "==", phoneNumber)
        .where("phoneNumberPrefix", "==", "+91")
        .limit(1)
        .get();

    if (userProfileQueryResult.empty) {
        // it's a new user
        const userAccountId = uuidv4();
        const activityId = uuidv4();

        const newUserProfilePath = `/USER/PRIVATE-PROFILE/FILES/${userAccountId}`;
        const userProfileRef = admin.firestore().doc(newUserProfilePath);

        const userProfileData = {
            firstName: "New User",
            lastName: null,
            emailAddress: null,
            phoneNumber: phoneNumber,
            phoneNumberPrefix: "+91",
            completePhoneNumber: `+91${phoneNumber}`,
            userAccountId: userAccountId,
            profession: null,
            linkedInUsername: null,
            gitHubUsername: null,
            universityName: null,
            createdOn: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedOn: null,
            fcmToken: null,
            activityId: `AID${activityId}`,
            emailVerifiedOn: null
        };

        await userProfileRef
            .create(userProfileData)
            .then(() => admin.auth().createCustomToken(userAccountId))
            .then(async (customToken) => {

                //create a single device login document
                const deviceId = `DID${uuidv4()}`;

                const singleDeviceLogin = {
                    deviceId: deviceId,
                    createdOn: admin.firestore.FieldValue.serverTimestamp(),
                };

                const singleDeviceLoginPath = `/SINGLE-DEVICE-LOGIN/${userAccountId}`;
                const singleDeviceLoginRef = admin
                    .firestore()
                    .doc(singleDeviceLoginPath);

                //upload the document
                const result = await singleDeviceLoginRef
                    .set(singleDeviceLogin)
                    .then((result) => {
                        return true;
                    })
                    .catch((error) => {
                        //failed to upload the document
                        responseBody.message = error.message;
                        return false;
                    });

                if (result !== true) {
                    response.status(400).send(responseBody);
                    return;
                }

                const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

                if (!singleDeviceLoginSnapshot.exists) {
                    responseBody.message = `Could not find device login records`;
                    response.status(400).send(responseBody);
                    return;
                }
                const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

                responseBody.data.userAccountId = userAccountId;
                responseBody.data.token = customToken;
                responseBody.data.singleDeviceLogin.deviceId = singleDeviceLoginData.deviceId;
                responseBody.data.singleDeviceLogin.createdOn = singleDeviceLoginData.createdOn._seconds;
                responseBody.message = "Signing in new user";
                response.status(200).send(responseBody);
            });
    } else {
        // already existing user

        const snapshot = userProfileQueryResult.docs.pop();
        if (!snapshot.exists) {
            responseBody.message = "User record not found";
            response.status(400).send(responseBody);
            return;
        }

        const userProfile = snapshot.data();
        const userAccountId = snapshot.id;
        const firstName = userProfile.firstName;
        const emailAddress = userProfile.emailAddress;
        const profession = userProfile.profession;

        if (firstName == null || emailAddress == null || profession == null) {
            responseBody.data.basicProfileDetailsUpdated = false;
        } else {
            responseBody.data.basicProfileDetailsUpdated = true;
        }

        //create a single device login document
        const deviceId = `DID${uuidv4()}`;

        const singleDeviceLogin = {
            deviceId: deviceId,
            createdOn: admin.firestore.FieldValue.serverTimestamp(),
        };

        const singleDeviceLoginPath = `/SINGLE-DEVICE-LOGIN/${userAccountId}`;
        const singleDeviceLoginRef = admin.firestore().doc(singleDeviceLoginPath);

        //upload the document
        const result = await singleDeviceLoginRef
            .set(singleDeviceLogin)
            .then((result) => {
                return true;
            })
            .catch((error) => {
                //failed to upload the document
                responseBody.message = error.message;
                return false;
            });

        if (result !== true) {
            response.status(400).send(responseBody);
            return;
        }

        const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

        if (!singleDeviceLoginSnapshot.exists) {
            responseBody.message = `Could not find device login records`;
            response.status(400).send(responseBody);
            return;
        }
        const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

        responseBody.data.token = await admin.auth().createCustomToken(userAccountId);
        responseBody.data.userAccountId = userAccountId;
        responseBody.data.singleDeviceLogin.deviceId = singleDeviceLoginData.deviceId;
        responseBody.data.singleDeviceLogin.createdOn = singleDeviceLoginData.createdOn._seconds;
        responseBody.message = "Signing in new user";
        response.status(200).send(responseBody);
    }
});

module.exports = router;
