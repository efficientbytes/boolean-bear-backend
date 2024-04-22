const express = require("express");
const router = express.Router();
const {v4: uuidv4} = require("uuid");
const admin = require("firebase-admin");
router.post("/", async (request, response) => {
    const phoneNumber = request.body.phoneNumber || null;
    const responseBody = {
        token: null,
        basicProfileDetailsUpdated: false,
        message: null,
        userAccountId: null,
        singleDeviceLogin: null,
    };

    if (phoneNumber == null) {
        responseBody.token = null;
        responseBody.basicProfileDetailsUpdated = false;
        responseBody.message = `Phone number is not provided`;
        responseBody.userAccountId = null;
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
                responseBody.token = customToken;
                responseBody.basicProfileDetailsUpdated = false;
                responseBody.userAccountId = userAccountId;

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
                    responseBody.singleDeviceLogin = null;
                    response.status(400).send(responseBody);
                    return;
                }

                const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

                if (!singleDeviceLoginSnapshot.exists) {
                    responseBody.singleDeviceLogin = null;
                    responseBody.message = `Could not find device login records`;
                    response.status(400).send(responseBody);
                    return;
                }
                const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

                responseBody.singleDeviceLogin = {
                    deviceId: singleDeviceLoginData.deviceId,
                    createdOn: singleDeviceLoginData.createdOn._seconds,
                };

                responseBody.message = "Signing in new user";
                response.status(200).send(responseBody);
            });
    } else {
        // already existing user

        const snapshot = userProfileQueryResult.docs.pop();
        if (!snapshot.exists) {
            responseBody.token = null;
            responseBody.basicProfileDetailsUpdated = null;
            responseBody.message = "User record not found";
            responseBody.userAccountId = null;
            response.status(400).send(responseBody);
            return;
        }

        const userProfile = snapshot.data();
        const userAccountId = snapshot.id;
        const firstName = userProfile.firstName;
        const emailAddress = userProfile.emailAddress;
        const profession = userProfile.profession;

        if (firstName == null || emailAddress == null || profession == null) {
            responseBody.basicProfileDetailsUpdated = false;
        } else {
            responseBody.basicProfileDetailsUpdated = true;
        }

        responseBody.userAccountId = userAccountId;
        responseBody.token = await admin.auth().createCustomToken(userAccountId);
        responseBody.message = `Sign in token generated successfully`;
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
            responseBody.singleDeviceLogin = null;
            response.status(400).send(responseBody);
            return;
        }

        const singleDeviceLoginSnapshot = await singleDeviceLoginRef.get();

        if (!singleDeviceLoginSnapshot.exists) {
            responseBody.singleDeviceLogin = null;
            responseBody.message = `Could not find device login records`;
            response.status(400).send(responseBody);
            return;
        }
        const singleDeviceLoginData = singleDeviceLoginSnapshot.data();

        responseBody.singleDeviceLogin = {
            deviceId: singleDeviceLoginData.deviceId,
            createdOn: singleDeviceLoginData.createdOn._seconds,
        };

        responseBody.message = "Signing in new user";
        response.status(200).send(responseBody);
    }
});

module.exports = router;
