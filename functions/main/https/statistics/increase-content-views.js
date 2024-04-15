const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const {user} = require("firebase-functions/v1/auth");
const router = express.Router();

router.post("/:contentId", async (request, response) => {
    logger.log(`http||collect-content-view-count.`);

    const contentId = request.params.contentId || null;
    const userAccountId = request.body.userAccountId || null;

    const responseBody = {
        contentId: contentId,
        userAccountId: null,
        message: null
    }

    if (userAccountId == null) {
        logger.error(`log||user account id cannot be null`);

        responseBody.message = `User account id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (contentId == null) {
        logger.error(`log||request body cannot be empty`);

        responseBody.message = `Request body cannot be null`;
        response.status(404).send(responseBody);
        return;
    }


    //check if content id exists
    const contentPath = `/ASSETS/CONTENTS/FILES/${contentId}`;
    const contentRef = admin.firestore().doc(contentPath);

    const contentQueryResult = await contentRef.get();

    if (!contentQueryResult.exists) {

        responseBody.message = `Content does not exists`;
        response.status(400).send(responseBody);
        return;
    }

    //if exists
    const viewsCollectionPath = `/STATISTICS/CONTENT-VIEWS/APP/FILES/${contentId}`;
    const viewsCollectionRef = admin.firestore().collection(viewsCollectionPath);

    // Map each item to a promise that performs the asynchronous task
    await viewsCollectionRef.doc().set({
        userAccountId: userAccountId,
        date: admin.firestore.FieldValue.serverTimestamp()
    }).then((result) => {
        responseBody.message = `Successfully content view increased`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
