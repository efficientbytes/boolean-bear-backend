const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");
const {logger} = require("firebase-functions");

router.post("/:courseId/join-waiting-list", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API join_course_waiting_list started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const courseId = request.params.courseId || null;
    logger.info(`Course id is ${courseId}`);

    const responseBody = {
        data: null,
        message: null,
    };

    responseBody.data = {
        courseId: null
    }

    if (courseId == null) {
        logger.warn(`Course id is not supplied`);
        responseBody.message = "Course id is not provided"
        response.status(400).send(responseBody);
        return;
    }

    const coursePath = `/ASSETS/CURATED/COURSES/${courseId}/`;
    const courseRef = admin.firestore().doc(coursePath);
    const courseQueryResult = await courseRef.get();

    if (!courseQueryResult.exists) {
        logger.warn(`Course document does not exists`);
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
        logger.warn(`User already joined the waiting list`);
        responseBody.message = "You have already registered";
        responseBody.data.courseId = courseId;
        response.status(200).send(responseBody);
        return;
    }

    const time = admin.firestore.FieldValue.serverTimestamp();

    logger.info(`User about to be added to the waiting list`);
    await courseWaitingListRef.add({
        userAccountId: userAccountId,
        registeredOn: time
    }).then((result) => {
        logger.info(`User added to the waiting list`);
        responseBody.message = "You have been added to our waiting list.";
        responseBody.data.courseId = courseId;
        response.status(200).send(responseBody);
    }).catch((error) => {
        logger.error(`User could not be added to the waiting list. Error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
