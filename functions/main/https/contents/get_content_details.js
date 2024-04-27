const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.get("/:contentId/play-details", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Authentication required.`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

    const contentId = request.params.contentId || null;

    const responseBody = {
        data: null,
        message: null
    }

    responseBody.data = {
        contentId: null,
        title: null,
        description: null,
        createdOn: null,
        updatedOn: null,
        instructorId: null,
        showAds: null,
        language: null,
        runTime: null,
        type1Thumbnail: null,
        instructorFirstName: null,
        instructorLastName: null,
        instructorProfilePic: null,
        nextSuggestion: null,
        hashTags: null,
        mentionedLinkIds: null,
    }

    if (contentId == null) {
        responseBody.message = `Content Id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const contentPath = `/ASSETS/CONTENTS/FILES/${contentId}`;
    const contentRef = admin.firestore().doc(contentPath);

    const contentQueryResult = await contentRef.get();

    if (!contentQueryResult.exists) {
        responseBody.message = `${contentId} content does not exists.`;
        response.status(404).send(responseBody);
        return;
    }

    const content = contentQueryResult.data();

    const videoId = content.videoId;
    const instructorId = content.instructorId;

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

        const video = videoSnapshot.data();
        const instructor = instructorSnapshot.data();

        responseBody.data.contentId = contentId;
        responseBody.data.title = content.title;
        responseBody.data.description = content.description;
        responseBody.data.createdOn = content.createdOn._seconds;
        responseBody.data.updatedOn = content.updatedOn._seconds;
        responseBody.data.instructorId = instructor.instructorId;
        responseBody.data.showAds = content.showAds;
        responseBody.data.language = video.language;
        responseBody.data.runTime = video.runTime;
        responseBody.data.type1Thumbnail = video.type1Thumbnail;
        responseBody.data.instructorFirstName = instructor.firstName;
        responseBody.data.instructorLastName = instructor.lastName;
        responseBody.data.instructorProfilePic = instructor.profilePic;
        responseBody.data.nextSuggestion = content.nextSuggestedContentId;
        responseBody.data.hashTags = content.hashTags;
        responseBody.data.mentionedLinkIds = content.mentionedLinkIds;
        responseBody.message = "Successfully fetched content details";

        response.status(200).send(responseBody);
    } catch (error) {
        logger.error(`get-contents-details||failed||http||error is ${error.message}`);
        responseBody.message = `Failed to fetch the content details. ${error.message}`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
