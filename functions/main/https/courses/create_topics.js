const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

class Topic {
    constructor(topic, description = "", topicId = null, displayIndex = 0, hashTags = ["coding"], createdOn = null, updatedOn = null, type1Thumbnail = "", type2Thumbnail = "") {
        this.topicId = topicId;
        this.topic = topic;
        this.description = description;
        this.displayIndex = displayIndex;
        this.hashTags = hashTags;
        this.createdOn = createdOn;
        this.updatedOn = updatedOn;
        this.type1Thumbnail = type1Thumbnail;
        this.type2Thumbnail = type2Thumbnail;
    }
}

router.post("/", async (request, response) => {

    const responseBody = {
        message: null,
    };

    const topics = [
        new Topic("Kotlin"),
        new Topic("Java"),
        new Topic("Figma"),
        new Topic("Git"),
        new Topic("Android XML"),
        new Topic("Android Compose"),
        new Topic("C++"),
    ];

    const topicsPath = `/ASSETS/CURATED/TOPICS/`;
    const topicRef = admin.firestore().collection(topicsPath);
    const time = admin.firestore.FieldValue.serverTimestamp();

    try {
        for (const topic of topics) {
            topic.topicId = topicRef.doc().id;
            await topicRef.doc(topic.topicId).set({
                topicId: topic.topicId,
                topic: topic.topic,
                description: topic.description,
                displayIndex: topic.displayIndex,
                hashTags: topic.hashTags,
                type1Thumbnail: topic.type1Thumbnail,
                type2Thumbnail: topic.type2Thumbnail,
                createdOn: time,
                updatedOn: time,
            });
        }
        responseBody.message = `Topics have been successfully uploaded.`;
        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = `Could not upload the topics, Error is ${error.message}`;
        response.status(500).send(responseBody);
    }
});

module.exports = router;
