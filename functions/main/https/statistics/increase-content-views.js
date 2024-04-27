const admin = require("firebase-admin");
const express = require("express");
const {user} = require("firebase-functions/v1/auth");
const {logger} = require("firebase-functions");
const router = express.Router();

router.post("/:contentId", async (request, response) => {
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
        message: null
    }

    if (contentId == null) {
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
        logger.error(`increase-content-views||failed||http||error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
