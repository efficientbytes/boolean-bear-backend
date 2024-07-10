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

    const firstName = request.body.firstName || null;
    const lastName = request.body.lastName || null;
    const emailAddress = request.body.emailAddress || null;
    const profession = request.body.profession || 0;

    const responseBody = {
        data: null,
        message: null,
    };

    if (firstName == null || emailAddress == null) {
        responseBody.message = "First name or Email address is not provided.";
        response.status(404).send(responseBody);
        return;
    }

    const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);

    let parsedProfession = 0

    if (typeof profession === 'string') {
        const num = parseInt(profession, 10);
        if (!isNaN(num)) {
            parsedProfession = num
        }
    }

    await userProfileRef
        .update({
            firstName: firstName,
            lastName: lastName,
            emailAddress: emailAddress,
            profession: parsedProfession,
        })
        .then((result) => {
            responseBody.message = "User profile has been updated.";
        })
        .catch((error) => {
            logger.error(`update-user-private-profile-basics||failed||http||error is ${error.message}`);
            responseBody.message = `User profile could not be updated. Error is ${error.message}`;
            response.status(500).send(responseBody);
        });

    const updatedUserProfileSnapshot = await userProfileRef.get();
    const userProfile = updatedUserProfileSnapshot.data();
    responseBody.data = {
        username: userProfile.username,
        profileImage: userProfile.profileImage,
        coverImage: userProfile.coverImage,
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
