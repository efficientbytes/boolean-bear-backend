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
        message: null
    }

    const userPrivateProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
    const userPrivateProfileRef = admin.firestore().doc(userPrivateProfilePath);
    const userPrivateProfileQueryResult = await userPrivateProfileRef.get();

    const userProfileData = userPrivateProfileQueryResult.data();

    try {
        const courseList = userProfileData.courseWaitingList;
        responseBody.message = `Successfully fetched course under waiting list.`;
        responseBody.data = courseList;
        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
