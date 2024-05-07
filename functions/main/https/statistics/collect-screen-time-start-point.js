const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.post("/", async (request, response) => {

    const screenTimingList = request.body.screenTimingPerDayList || null;
    const userAccountId = request.body.userAccountId || null;

    const responseBody = {
        message: null,
    };

    const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/${userAccountId}`;
    const userProfileRef = admin.firestore().doc(userProfilePath);
    const userProfileSnapshot = await userProfileRef.get();

    if (!userProfileSnapshot.exists) {
        responseBody.message = "User profile does not exists.";
        response.status(404).send(responseBody);
        return;
    }

    if (screenTimingList == null || screenTimingList.length === 0) {
        responseBody.message = `Incomplete request cannot be processed.`;
        response.status(400).send(responseBody);
        return;
    }

    const screenTimingCollectionPath = `/USER/ANALYTICS/APP/SCREEN-TIMINGS/${userAccountId}`;
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
        logger.error(`collect-screen-time-start-point||failed||http||error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
