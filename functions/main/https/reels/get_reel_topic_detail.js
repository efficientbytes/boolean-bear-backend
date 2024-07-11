const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.get("/:topicId/topic-details", verifyAppCheckToken, async (request, response) => {


    const topicId = request.params.topicId || null;

    const responseBody = {
        message: null,
        data: null
    };

    if (topicId === null) {
        responseBody.message = `Topic Id is not passed`;
        response.status(400).send(responseBody);
        return;
    }

    const topicsPath = `/ASSETS/REELS/TOPICS/${topicId}`;
    const topicsRef = admin.firestore().doc(topicsPath);
    const topicsQueryResult = await topicsRef.get();

    if (!topicsQueryResult.exists) {
        responseBody.message = `Topic does not exists`;
        response.status(400).send(responseBody);
        return;
    }

    const topicData = topicsQueryResult.data();

    const topicResponse = {
        topicId: topicsQueryResult.id,
        topic: topicData.topic,
        displayIndex: topicData.displayIndex,
        type1Thumbnail: topicData.type1Thumbnail
    }

    responseBody.message = `Successfully fetched topic details`;
    responseBody.data = topicResponse;
    response.status(200).send(responseBody);

});

module.exports = router;
