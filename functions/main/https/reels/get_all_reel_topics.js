const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.get("/", verifyAppCheckToken, async (request, response) => {

    const responseBody = {
        message: null,
        data: null
    };

    const topicsPath = `/ASSETS/REELS/TOPICS/`;
    const topicsRef = admin.firestore().collection(topicsPath);
    const topicsQueryResult = await topicsRef.get();

    if (topicsQueryResult.empty) {
        responseBody.message = `There are no reel topics`;
        response.status(400).send(responseBody);
        return;
    }

    const topicSnapshots = topicsQueryResult.docs;
    const list = [];

    for (const topic of topicSnapshots) {

        const topicData = topic.data();

        const topicResponse = {
            topicId: topic.id,
            topic: topicData.topic,
            displayIndex: topicData.displayIndex,
            type1Thumbnail: topicData.type1Thumbnail
        }

        list.push(topicResponse);

    }

    responseBody.message = `Successfully fetched ${list.length} reel topics`;
    responseBody.data = list;
    response.status(200).send(responseBody);

});

module.exports = router;
