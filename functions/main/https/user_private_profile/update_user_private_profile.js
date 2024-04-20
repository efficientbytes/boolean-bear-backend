const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
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

    const firstName = request.body.firstName || null;
    const lastName = request.body.lastName || null;
    const emailAddress = request.body.emailAddress || null;
    const profession = request.body.profession || null;
    const linkedInUsername = request.body.linkedInUsername || null;
    const gitHubUsername = request.body.gitHubUsername || null;
    const universityName = request.body.universityName || null;

    const responseBody = {
        userProfile: null,
        message: null,
        signOut: false,
    };

    const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        //user does not exits
        logger.error(
            `log||user account id is ${userAccountId}. User profile does not exists.`,
        );

        responseBody.userProfile = null;
        responseBody.message = "User profile does not exists.";
        responseBody.signOut = true;
        response.status(404).send(responseBody);
        return;
    }

    // user profile exits, so update the fields
    logger.log(`log||user account id is ${userAccountId}. User profile exists.`);
    await userProfileRef
        .update({
            firstName: firstName,
            lastName: lastName,
            emailAddress: emailAddress,
            profession: profession,
            universityName: universityName,
            linkedInUsername: linkedInUsername,
            gitHubUsername: gitHubUsername,
        })
        .then((result) => {
            logger.log(
                `log||user account id is ${userAccountId}. User profile was updated at ${result.writeTime.toDate()}.`,
            );

            responseBody.message = "User profile has been updated.";
            responseBody.signOut = false;
        })
        .catch((error) => {
            logger.log(
                `log||user account id is ${userAccountId}. User profile could not be updated. Catch error is ${error.message}`,
            );

            responseBody.userProfile = null;
            responseBody.message = `User profile could not be updated. Error is ${error.message}`;
            responseBody.signOut = false;
            response.status(500).send(responseBody);
        });

    const updatedUserProfileSnapshot = await userProfileRef.get();
    const userProfile = updatedUserProfileSnapshot.data();

    responseBody.userProfile = {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        emailAddress: userProfile.emailAddress,
        phoneNumber: userProfile.phoneNumber,
        phoneNumberPrefix: userProfile.phoneNumberPrefix,
        completePhoneNumber: userProfile.completePhoneNumber,
        userAccountId: userProfile.userAccountId,
        activityId: userProfile.activityId,
        profession: userProfile.profession,
        linkedInUsername: userProfile.linkedInUsername,
        gitHubUsername: userProfile.gitHubUsername,
        universityName: userProfile.universityName,
        createdOn: userProfile.createdOn._seconds,
        lastUpdatedOn: userProfile.createdOn._seconds,
    };

    response.status(200).send(responseBody);
});

module.exports = router;
