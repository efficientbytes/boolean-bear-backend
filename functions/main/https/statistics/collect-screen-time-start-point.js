const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();

router.post("/", async (request, response) => {
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

    const screenTimingList = request.body || null;

    const responseBody = {
        message: null,
    };

    if (screenTimingList == null || screenTimingList.length === 0) {
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
        logger.error(`collect-screen-time-start-point||failed||http||error is ${error.message}`);
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
