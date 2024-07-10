const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

const getCourseAsyncFunction = async (courseId, topicId) => {

    const coursePath = `/ASSETS/CURATED/COURSES/${courseId}`;
    const courseRef = admin.firestore().doc(coursePath);
    const courseQueryResult = await courseRef.get();

    if (!courseQueryResult.exists) return null;

    const courseData = courseQueryResult.data();

    return {
        courseId: courseData.courseId,
        title: courseData.title,
        type1Thumbnail: courseData.type1Thumbnail,
        isAvailable: courseData.isAvailable,
        nonAvailabilityReason: courseData.nonAvailabilityReason,
        hashTags: courseData.hashTags,
        createdOn: courseData.createdOn._seconds,
        topicId: topicId,
    };

};

const getCourseBundleAsyncFunction = async (snapshot) => {

    if (!snapshot.exists) {
        return null;
    }

    const topicData = snapshot.data();

    const courseIds = topicData.courseIds;

    if (courseIds.length === 0) return null;

    const courseDetailAsyncPromises = courseIds.map(courseId => getCourseAsyncFunction(courseId, snapshot.id));

    const courseList = [];

    const coursePromisesResult = await Promise.all(courseDetailAsyncPromises)
        .then((responses) => {

            const filteredResponses = responses.filter((response) => response !== null);

            filteredResponses.forEach((response) => {
                courseList.push(response);
            });

            return true;
        })
        .catch((error) => {
            return false;
        });

    if (coursePromisesResult === false || courseList.length === 0) {
        return null;
    }

    const topicResponse = {
        topicId: snapshot.id,
        topic: topicData.topic,
        type1Thumbnail: topicData.type1Thumbnail,
        displayIndex: topicData.displayIndex,
    }

    return {
        topicDetails: topicResponse,
        courseList: courseList
    };

}

router.get("/", verifyAppCheckToken, async (request, response) => {

    const responseBody = {
        data: null,
        message: null
    }

    const topicsPath = `/ASSETS/CURATED/TOPICS/`;
    const topicRef = admin.firestore().collection(topicsPath);

    const topicQueryResult = await topicRef.get();

    if (topicQueryResult.empty) {
        responseBody.message = `No topics available.`;
        response.status(400).send(responseBody);
        return;
    }

    const list = [];

    const topicSnapshots = topicQueryResult.docs;

    const topicDetailsAsyncPromises = topicSnapshots.map(snapshot => getCourseBundleAsyncFunction(snapshot));

    const topicDetailsPromiseResult = await Promise.all(topicDetailsAsyncPromises).then((responses) => {

        const filteredResponses = responses.filter((response) => response !== null);

        filteredResponses.forEach((response) => {
            list.push(response);
        });

        return true;
    }).catch((error) => {
        responseBody.message = error.message;
        return false;
    });

    if (topicDetailsPromiseResult === false) {
        response.status(500).send(responseBody);
        return;
    }

    responseBody.message = `Successfully fetched ${list.length} courses bundles`;
    responseBody.data = list;
    response.status(200).send(responseBody);

});

module.exports = router;
