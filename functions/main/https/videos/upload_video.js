const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const {v4: uuidv4} = require("uuid");
const router = express.Router();

router.post("/", async (request, response) => {
    logger.log(`http||post-video.`);

    const videoId = uuidv4();
    const videoSize = request.body.videoSize || null;
    const runTime = request.body.runTime || null;
    const downloadable = request.body.downloadable || false;
    const language = request.body.language || "EN";
    const type1Thumbnail = request.body.type1Thumbnail || null;

    const responseBody = {
        message: null,
    };

    if (videoId == null) {
        logger.error(`log||video id cannot be null`);

        responseBody.message = `Video id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (videoSize == null) {
        logger.error(`log||video size cannot be null`);

        responseBody.message = `Video size cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (runTime == null) {
        logger.error(`log||video runtime cannot be null`);

        responseBody.message = `Video runtime cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const parsedRuntime = parseFloat(runTime);
    const parsedVideoSize = parseFloat(videoSize);

    if (isNaN(parsedRuntime)) {
        logger.error(`log||video runtime parsing failed. provided runtime is ${runTime}`);

        responseBody.message = `video runtime parsing failed. provided runtime is ${runTime}`;
        response.status(400).send(responseBody);
        return;
    }

    if (isNaN(parsedVideoSize)) {
        logger.error(`log||video size parsing failed. provided video size is ${videoSize}`);

        responseBody.message = `video size parsing failed. provided video size is ${videoSize}`;
        response.status(400).send(responseBody);
        return;
    }

    const videoCollectionPath = `/ASSETS/VIDEOS/FILES/`;
    const videoCollectionRef = admin.firestore().collection(videoCollectionPath);

    const time = admin.firestore.FieldValue.serverTimestamp();

    await videoCollectionRef.doc(videoId).set({
        videoId: videoId,
        uploadedOn: time,
        updatedOn: time,
        videoSize: parsedVideoSize,
        runTime: parsedRuntime,
        downloadable: downloadable,
        language: language,
        type1Thumbnail: type1Thumbnail
    }).then(() => {

        logger.log(`log||uploaded video with video id ${videoId} successfully`);

        responseBody.message = `Uploaded video with video id ${videoId}`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        logger.error(`log||failed to upload video with video id ${videoId}`);

        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
