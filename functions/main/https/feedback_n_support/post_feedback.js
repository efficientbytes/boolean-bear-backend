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

    const feedback = request.body.feedback || null;

    const responseBody = {
        message: null,
    };

    const feedbackPath = `/USER/FEEDBACKS/APP/`;
    const feedbackRef = admin.firestore().collection(feedbackPath);

    const feedbackQuery = feedbackRef.where("userAccountId", "==", userAccountId);

    const feedbackQueryResult = await feedbackQuery.get();

    if (feedbackQueryResult.size >= 3) {
        responseBody.message = `We're grateful for your feedback! It appears you've exceeded the maximum number of submissions allowed at this time. Your insights are valuable, and we encourage you to revisit us in the future if you have more feedback to offer.`;
        response.status(400).send(responseBody);
        return;
    }

    await feedbackRef
        .add({
            feedback: feedback,
            userAccountId: userAccountId,
            submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
            responseBody.message = `Thank you for taking the time to share your feedback with us. We value your thoughts and will use them to enhance your experience.`;
            response.status(200).send(responseBody);
        })
        .catch((error) => {
            logger.error(`post-feedback||failed||http||error is ${error.message}`);
            responseBody.message = `We apologize for the inconvenience. It seems there was an issue submitting your feedback... Error ${error.message}`;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
