const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const {v4: uuidv4} = require("uuid");
const router = express.Router();

router.post("/", async (request, response) => {
    logger.log(`http||upload-content.`);

    const contentId = uuidv4();
    const videoId = request.body.videoId || null;
    const instructorId = request.body.instructorId || null;
    const mentionedLinksId = ["", ""];
    const nextSuggestedContentId = request.body.nextSuggestedContentId || null;
    const title = request.body.title || null;
    const description = request.body.description || null;
    const createdOn = request.body.createdOn || null;
    const updatedOn = request.body.updatedOn || null;
    const showAds = request.body.showAds || true;
    const adTag = null;
    const searchTags = ["", ""];

    const responseBody = {
        message: null,
    };

    if (videoId == null) {
        logger.error(`log||video id cannot be null`);

        responseBody.message = `Video id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (title == null) {
        logger.error(`log||title cannot be null`);

        responseBody.message = `title cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (description == null) {
        logger.error(`log||description cannot be null`);

        responseBody.message = `description cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const time = admin.firestore.FieldValue.serverTimestamp();

    const contentCollectionPath = `/ASSETS/CONTENTS/FILES/`;
    const contentCollectionRef = admin.firestore().collection(contentCollectionPath);

    await contentCollectionRef.doc(contentId).set({
        contentId: contentId,
        videoId: videoId,
        instructorId: uuidv4(),
        mentionedLinksId: mentionedLinksId,
        nextSuggestedContentId: nextSuggestedContentId,
        title: title,
        description: description,
        createdOn: time,
        uploadedOn: time,
        showAds: showAds,
        adTag: adTag,
        searchTags: searchTags
    }).then(() => {

        logger.log(`log||uploaded content with content id ${contentId} successfully`);

        responseBody.message = `Uploaded content with content id ${contentId}`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        logger.error(`log||failed to upload content with content id ${contentId}`);

        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
