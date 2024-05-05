const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

const asyncFunction = async (reelId, topicId) => {

    const reelPath = `/ASSETS/REELS/CONTENTS/${reelId}`;
    const reelRef = admin.firestore().doc(reelPath);
    const reelQueryResult = await reelRef.get();

    if (!reelQueryResult.exists) {
        return null;
    }

    const reelData = reelQueryResult.data();
    const videoId = reelData.videoId;
    const instructorId = reelData.instructorId;

    const videoPath = `/ASSETS/VIDEOS/FILES/${videoId}`;
    const videoRef = admin.firestore().doc(videoPath);
    const videoPromise = videoRef.get();

    const instructorPath = `/INSTRUCTOR/PROFILE/FILES/${instructorId}`;
    const instructorRef = admin.firestore().doc(instructorPath);
    const instructorPromise = instructorRef.get();

    try {
        const promise = await Promise.all([videoPromise, instructorPromise]);
        const videoSnapshot = promise[0];
        const instructorSnapshot = promise[1];

        const videoData = videoSnapshot.data();
        const instructorData = instructorSnapshot.data();

        let fullName = instructorData.firstName;
        if (instructorData.lastName != null || instructorData.lastName !== "") {
            fullName = fullName + " " + instructorData.lastName;
        }

        return {
            reelId: reelData.reelId,
            title: reelData.title,
            createdOn: reelData.createdOn._seconds,
            instructorName: fullName,
            runTime: videoData.runTime,
            thumbnail: videoData.type1Thumbnail,
            hashTags: reelData.hashTags,
            topicId: topicId,
        };
    } catch (error) {
        return null;
    }
};

router.get("/:topicId", async (request, response) => {

    const topicId = request.params.topicId || null;

    const responseBody = {
        message: null,
        data: null
    };

    if (topicId == null) {
        responseBody.message = `Topic Id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const topicPath = `/ASSETS/REELS/TOPICS/${topicId}`;
    const topicRef = admin.firestore().doc(topicPath);
    const topicQueryResult = await topicRef.get();

    if (!topicQueryResult.exists) {
        responseBody.message = `Topic id does not exists.`;
        response.status(400).send(responseBody);
        return;
    }

    const topicData = topicQueryResult.data();
    const reelIds = topicData.reelIds;

    if (reelIds.length === 0) {
        responseBody.data = [];
        responseBody.message = `There are no reels available currently.`;
        response.status(200).send(responseBody);
        return;
    }

    const asyncTasks = reelIds.map(reelId => asyncFunction(reelId, topicId));
    const list = [];

    const reelFetchResult = await Promise.all(asyncTasks)
        .then((responses) => {
            const filteredResponses = responses.filter((response) => response !== null);
            filteredResponses.forEach((response) => {
                list.push(response);
            });
            return true;
        })
        .catch((error) => {
            responseBody.message = error.message;
            return false;
        });

    if (reelFetchResult === false) {
        response.status(500).send(responseBody);
        return;
    }

    responseBody.message = `Successfully fetched ${list.length} reels under ${topicData.topic}`;
    responseBody.data = list;
    response.status(200).send(responseBody);

});

module.exports = router;
