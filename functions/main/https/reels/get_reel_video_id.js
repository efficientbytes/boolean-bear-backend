const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/:reelId/video-id", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API get_video_id started`);
    const reelId = request.params.reelId || null;
    logger.info(`Reel id is ${reelId}`);
    const responseBody = {
        data: null,
        message: null
    }

    responseBody.data = {
        videoId: null,
    }

    if (reelId == null) {
        logger.warn(`Reel id is not supplied`);
        responseBody.message = `Reel id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const reelPath = `/ASSETS/REELS/FILES/${reelId}`;
    const reelRef = admin.firestore().doc(reelPath);
    const reelQueryResult = await reelRef.get();

    if (!reelQueryResult.exists) {
        logger.warn(`Reel document does not exists`);
        responseBody.message = `Reel does not exists.`;
        response.status(404).send(responseBody);
        return;
    }

    const reelData = reelQueryResult.data();
    const videoId = reelData.videoId || null;
    logger.info(`Video id is ${videoId}`);

    if (videoId !== null && videoId !== undefined) {
        responseBody.data.videoId = videoId;
        responseBody.message = `Successfully fetched video Id`;
        return response.status(200).send(responseBody);
    } else {
        responseBody.message = `Failed to fetch video Id`;
        return response.status(400).send(responseBody);
    }
});

module.exports = router;
