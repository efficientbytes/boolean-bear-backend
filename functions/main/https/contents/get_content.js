const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.get("/:contentId", async (request, response) => {
    const contentId = request.params.contentId || null;
    const viewType = request.query.viewType || "YOUTUBE";

    const shuffledContent = {
        contentId: null,
        title: null,
        instructorName: null,
        createdOn: null,
        runTime: null,
        thumbnail: null,
        hashTags: null
    }

    const responseBody = {
        data: null,
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
        response.status(400).send(responseBody);
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

        if (viewType === "YOUTUBE") {

            let fullName = instructor.firstName;
            if (instructor.lastName != null || instructor.lastName !== "") {
                fullName = fullName + " " + instructor.lastName;
            }

            shuffledContent.contentId = contentId;
            shuffledContent.title = content.title;
            shuffledContent.createdOn = content.createdOn._seconds;
            shuffledContent.instructorName = fullName;
            shuffledContent.runTime = video.runTime;
            shuffledContent.thumbnail = video.type1Thumbnail;
            shuffledContent.hashTags = content.hashTags;

            responseBody.data = shuffledContent;
            responseBody.message = `Successfully fetched content`;

            response.status(200).send(responseBody);
        }

    } catch (error) {
        logger.error(`get-contents||failed||http||error is ${error.message}`);
        responseBody.message = `Failed to fetch the content. ${error.message}`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
