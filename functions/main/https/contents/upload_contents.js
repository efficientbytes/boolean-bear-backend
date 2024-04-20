const admin = require("firebase-admin");
const express = require("express");
const {v4: uuidv4} = require("uuid");
const router = express.Router();

router.post("/", async (request, response) => {
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
        responseBody.message = `Video id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (title == null) {
        responseBody.message = `title cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (description == null) {
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
        updatedOn: time,
        showAds: showAds,
        adTag: adTag,
        searchTags: searchTags
    }).then(() => {
        responseBody.message = `Uploaded content with content id ${contentId}`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
