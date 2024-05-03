const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    const responseBody = {
        data: null,
        message: null
    }

    const topicsPath = `/ASSETS/CONTENTS/TOPICS/`;
    const topicRef = admin.firestore().collection(topicsPath);

    const topicQueryResult = await topicRef.get();

    if (topicQueryResult.empty) {
        responseBody.message = `No topics available.`;
        response.status(400).send(responseBody);
        return;
    }
    const list = [];

    const topicSnapshots = topicQueryResult.docs;

    for (const topic of topicSnapshots) {
        const topicData = topic.data();
        const topicResponse = {
            topicId: topic.id,
            topic: topicData.topic,
            type1Thumbnail: topicData.type1Thumbnail
        }
        list.push(topicResponse)
    }

    responseBody.message = `${list.length} topics have been fetched.`;
    responseBody.data = list;
    response.status(200).send(responseBody);
});

module.exports = router;
