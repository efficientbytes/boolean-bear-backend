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

    const firstName = request.body.firstName || null;
    const lastName = request.body.lastName || null;
    const emailAddress = request.body.emailAddress || null;
    const profession = request.body.profession || null;

    const responseBody = {
        userProfile: null,
        message: null,
        signOut: true,
    };

    if (firstName == null || emailAddress == null) {
        responseBody.userProfile = null;
        responseBody.message = "First name or Email address is not provided.";
        responseBody.signOut = false;
        response.status(404).send(responseBody);
        return;
    }

    const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);

    await userProfileRef
        .update({
            firstName: firstName,
            lastName: lastName,
            emailAddress: emailAddress,
            profession: profession,
        })
        .then((result) => {
            responseBody.message = "User profile has been updated.";
            responseBody.signOut = false;
        })
        .catch((error) => {
            logger.error(`update-user-private-profile-basics||failed||http||error is ${error.message}`);
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
        gitHubUserName: userProfile.gitHubUserName,
        universityName: userProfile.universityName,
        createdOn: userProfile.createdOn._seconds,
        lastUpdatedOn: userProfile.createdOn._seconds,
    };

    response.status(200).send(responseBody);
});

module.exports = router;
