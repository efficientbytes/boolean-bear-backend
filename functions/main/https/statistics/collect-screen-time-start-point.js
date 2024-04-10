const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.post("/:userAccountId", async (request, response) => {
    logger.log(`http||collect-screen-timing.`);

    const userAccountId = request.params.userAccountId || null;
    const screenTimingList = request.body || null;

    const responseBody = {
        message: null,
    };

    if (userAccountId == null) {
        logger.error(`log||user account id cannot be null`);

        responseBody.message = `User account id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (screenTimingList == null || screenTimingList.length === 0) {
        logger.error(`log||request body cannot be empty`);

        responseBody.message = `Incomplete request cannot be processed.`;
        response.status(400).send(responseBody);
        return;
    }

    const screenTimingCollectionPath = `/STATISTICS/SCREEN-TIMING/APP/FILES/${userAccountId}`;
    const screenTimingCollectionRef = admin.firestore().collection(screenTimingCollectionPath);

    // Map each item to a promise that performs the asynchronous task
    const promises = screenTimingList.map((item) => {
        const timeInMillis = item.date;
        return screenTimingCollectionRef.doc(item.date.toString()).set({
            date: admin.firestore.Timestamp.fromDate(new Date(timeInMillis)),
            screenTime: item.screenTime,
        });
    });

    await Promise.all(promises).then(() => {
        responseBody.message = `Uploaded successfully`
        response.status(200).send(responseBody);
    }).catch(error => {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
