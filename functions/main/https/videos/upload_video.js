const admin = require("firebase-admin");
const express = require("express");
const {v4: uuidv4} = require("uuid");
const router = express.Router();

router.post("/", async (request, response) => {
    const videoId = request.body.videoId || uuidv4();
    const videoSize = request.body.videoSize || null;
    const runTime = request.body.runTime || null;
    const downloadable = request.body.downloadable || false;
    const language = request.body.language || "EN";
    const type1Thumbnail = request.body.type1Thumbnail || null;

    const responseBody = {
        message: null,
    };

    if (videoId == null) {
        responseBody.message = `Video id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (videoSize == null) {
        responseBody.message = `Video size cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (runTime == null) {
        responseBody.message = `Video runtime cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const parsedRuntime = parseFloat(runTime);
    const parsedVideoSize = parseFloat(videoSize);

    if (isNaN(parsedRuntime)) {
        responseBody.message = `video runtime parsing failed. provided runtime is ${runTime}`;
        response.status(400).send(responseBody);
        return;
    }

    if (isNaN(parsedVideoSize)) {
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
        responseBody.message = `Uploaded video with video id ${videoId}`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
