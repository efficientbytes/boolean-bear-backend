const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/:contentId/play-details", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Invalid auth token`});
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
        message: null
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

        responseBody.contentId = contentId;
        responseBody.title = content.title;
        responseBody.description = content.description;
        responseBody.createdOn = content.createdOn._seconds;
        responseBody.updatedOn = content.updatedOn._seconds;
        responseBody.instructorId = instructor.instructorId;
        responseBody.showAds = content.showAds;
        responseBody.language = video.language;
        responseBody.runTime = video.runTime;
        responseBody.type1Thumbnail = video.type1Thumbnail;
        responseBody.instructorFirstName = instructor.firstName;
        responseBody.instructorLastName = instructor.lastName;
        responseBody.instructorProfilePic = instructor.profilePic;
        responseBody.nextSuggestion = content.nextSuggestedContentId;
        responseBody.hashTags = content.hashTags;
        responseBody.mentionedLinkIds = content.mentionedLinkIds;
        responseBody.message = "Successfully fetched content details";

        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = `Failed to fetch the content details. ${error.message}`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
