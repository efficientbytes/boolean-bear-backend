const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.get("/:reelId/reel-details", async (request, response) => {
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

    const reelId = request.params.reelId || null;
    const inDetailed = request.query.in_detailed || false;

    const responseBody = {
        data: null,
        message: null
    }

    if (reelId == null) {
        responseBody.message = `Reel id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (inDetailed == null) {
        responseBody.message = `Parameter detailed is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const reelPath = `/ASSETS/REELS/FILES/${reelId}`;
    const reelRef = admin.firestore().doc(reelPath);
    const reelQueryResult = await reelRef.get();

    if (!reelQueryResult.exists) {
        responseBody.message = `Reel does not exists.`;
        response.status(404).send(responseBody);
        return;
    }

    const reelData = reelQueryResult.data();
    const videoId = reelData.videoId;
    const instructorId = reelData.instructorId;

    const videoPath = `/ASSETS/VIDEOS/FILES/${videoId}`;
    const videoRef = admin.firestore().doc(videoPath);
    const videoPromise = videoRef.get();

    const instructorPath = `/INSTRUCTORS/PRIVATE-PROFILES/FILES/${instructorId}`;
    const instructorRef = admin.firestore().doc(instructorPath);
    const instructorPromise = instructorRef.get();

    if (inDetailed == true) {

        responseBody.data = {
            reelId: null,
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
            nextReelId: null,
            hashTags: null,
            mentionedLinkIds: null,
            topicId: null
        }

        try {
            const promise = await Promise.all([videoPromise, instructorPromise]);
            const videoSnapshot = promise[0];
            const instructorSnapshot = promise[1];

            const videoData = videoSnapshot.data();
            const instructorData = instructorSnapshot.data();

            responseBody.data.reelId = reelId;
            responseBody.data.title = reelData.title;
            responseBody.data.description = reelData.description;
            responseBody.data.createdOn = reelData.createdOn._seconds;
            responseBody.data.updatedOn = reelData.updatedOn._seconds;
            responseBody.data.instructorId = instructorData.instructorId;
            responseBody.data.showAds = reelData.showAds;
            responseBody.data.language = videoData.language;
            responseBody.data.runTime = videoData.runTime;
            responseBody.data.type1Thumbnail = videoData.type1Thumbnail;
            responseBody.data.instructorFirstName = instructorData.firstName;
            responseBody.data.instructorLastName = instructorData.lastName;
            responseBody.data.instructorProfilePic = instructorData.profileImage;
            responseBody.data.nextReelId = reelData.nextReelId;
            responseBody.data.hashTags = reelData.hashTags;
            responseBody.data.mentionedLinkIds = reelData.mentionedLinkIds;

            responseBody.message = "Successfully fetched reel details";
            response.status(200).send(responseBody);
            return;
        } catch (error) {
            logger.error(`get-reel-details||failed||http||error is ${error.message}`);
            responseBody.message = `Failed to fetch the reel details. ${error.message}`;
            response.status(500).send(responseBody);
            return;
        }
        return;
    }

    if (inDetailed == false) {

        responseBody.data = {
            reelId: null,
            title: null,
            createdOn: null,
            instructorName: null,
            runTime: null,
            thumbnail: null,
            hashTags: null,
            topicId: null,
        }

        try {

            const promise = await Promise.all([videoPromise, instructorPromise]);
            const videoSnapshot = promise[0];
            const instructorSnapshot = promise[1];

            const videoData = videoSnapshot.data();
            const instructorData = instructorSnapshot.data();

            let fullName = instructorData.firstName;
            if (instructorData.lastName != null || instructorData.lastName !== "") {
                fullName = fullName + " " + instructorData.lastName;
            }

            responseBody.data.reelId = reelData.reelId;
            responseBody.data.title = reelData.title;
            responseBody.data.createdOn = reelData.createdOn._seconds;
            responseBody.data.instructorName = fullName;
            responseBody.data.runTime = videoData.runTime;
            responseBody.data.thumbnail = videoData.type1Thumbnail;
            responseBody.data.hashTags = reelData.hashTags;

            responseBody.message = `Successfully fetched reel details`;
            response.status(200).send(responseBody);

        } catch (error) {
            logger.error(`get-reel-details||failed||http||error is ${error.message}`);
            responseBody.message = `Failed to fetch the reel details. ${error.message}`;
            response.status(500).send(responseBody);
        }

    }

});

module.exports = router;
