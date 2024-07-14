const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/:contentId", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API increase_content_views started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const contentId = request.params.contentId || null;
    logger.info(`Content id is ${contentId}`);

    const responseBody = {
        message: null
    }

    if (contentId == null) {
        logger.warn(`Content id is not supplied`);
        responseBody.message = `Request body cannot be null`;
        response.status(404).send(responseBody);
        return;
    }


    //check if content id exists
    const contentPath = `/ASSETS/REELS/FILES/${contentId}`;
    const contentRef = admin.firestore().doc(contentPath);
    const contentQueryResult = await contentRef.get();

    if (!contentQueryResult.exists) {
        logger.warn(`Content document does not exists`);
        responseBody.message = `Content does not exists`;
        response.status(400).send(responseBody);
        return;
    }

    //if exists
    const viewsCollectionPath = `/ASSETS/REELS/ANALYTICS/FILES/${contentId}`;
    const viewsCollectionRef = admin.firestore().collection(viewsCollectionPath);

    logger.info(`Content view document about to be created`);
    // Map each item to a promise that performs the asynchronous task
    await viewsCollectionRef.doc().set({
        userAccountId: userAccountId,
        date: admin.firestore.FieldValue.serverTimestamp()
    }).then((result) => {
        logger.info(`Content view increased`);
        responseBody.message = `Successfully content view increased`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        logger.error(`Content view could not be increased. Error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
