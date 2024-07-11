const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/:courseId/join-waiting-list", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const userAccountId = request.userAccountId;
    const courseId = request.params.courseId || null;

    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        courseId: null
    }

    if (courseId == null) {
        responseBody.message = "Course id is not provided"
        response.status(400).send(responseBody);
        return;
    }

    const coursePath = `/ASSETS/CURATED/COURSES/${courseId}/`;
    const courseRef = admin.firestore().doc(coursePath);
    const courseQueryResult = await courseRef.get();

    if (!courseQueryResult.exists) {
        responseBody.message = "Course does not exists"
        response.status(400).send(responseBody);
        return;
    }

    const courseWaitingListPath = `/ASSETS/CURATED/COURSES/${courseId}/WAITING-LIST`;
    const courseWaitingListRef = admin.firestore().collection(courseWaitingListPath);
    const courseWaitingListQueryResult = await courseWaitingListRef.where("userAccountId", "==", userAccountId)
        .limit(1)
        .get();

    if (!courseWaitingListQueryResult.empty) {
        const waitingList = courseWaitingListQueryResult.docs.pop();
        const waitingListData = waitingList.data();

        responseBody.message = "You have already registered";
        responseBody.data.courseId = courseId;
        response.status(200).send(responseBody);
        return;
    }

    const time = admin.firestore.FieldValue.serverTimestamp();

    await courseWaitingListRef.add({
        userAccountId: userAccountId,
        registeredOn: time
    }).then((result) => {

        responseBody.message = "You have been added to our waiting list.";
        responseBody.data.courseId = courseId;
        response.status(200).send(responseBody);

    }).catch((error) => {

        responseBody.message = error.message;
        response.status(500).send(responseBody);

    });

});

module.exports = router;
