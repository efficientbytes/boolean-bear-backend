const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/:contentId", async (request, response) => {
    logger.log(`http||get-shuffled-content-ids.`);

    const contentId = request.params.contentId || null;
    const viewType = request.query.viewType || "YOUTUBE";

    const youtubeContentView = {
        contentId: null,
        title: null,
        instructorName: null,
        createdOn: null,
        runTime: null,
        thumbnail: null,
    }

    const responseBody = {
        youtubeContentView: null,
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
    logger.log(`log||content title is ${content.title}`);

    const videoId = content.videoId;
    logger.log(`log||content title ${content.title}. video id is ${videoId}`);
    const instructorId = content.instructorId;
    logger.log(`log||content title ${content.title}. instructor id is ${instructorId}`);

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

        logger.log(`log||resolved video promise.video id is ${video.videoId}`);
        logger.log(`log||resolved instructor promise. instructor id is ${instructor.instructorId}`);

        if (viewType === "YOUTUBE") {

            let fullName = instructor.firstName;
            if (instructor.lastName != null || instructor.lastName !== "") {
                fullName = fullName + " " + instructor.lastName;
            }

            youtubeContentView.contentId = contentId;
            youtubeContentView.title = content.title;
            youtubeContentView.createdOn = content.createdOn._seconds;
            youtubeContentView.instructorName = fullName;
            youtubeContentView.runTime = video.runTime;
            youtubeContentView.thumbnail = video.type1Thumbnail;

            responseBody.youtubeContentView = youtubeContentView;
            responseBody.message = `Successfully fetched content`;

            response.status(200).send(responseBody);
        }

    } catch (error) {
        logger.error(`log|| Error is ${error.message}`);
        responseBody.message = `Failed to fetch the content. ${error.message}`;

        response.status(500).send(responseBody);

    }

});

module.exports = router;
