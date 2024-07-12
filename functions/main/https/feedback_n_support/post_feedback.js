const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API post_feedback started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const feedback = request.body.feedback || null;
    logger.info(`Feedback is ${feedback}`);

    const responseBody = {
        message: null,
    };

    const feedbackPath = `/USERS/FEEDBACKS/APP/`;
    const feedbackRef = admin.firestore().collection(feedbackPath);

    const feedbackQuery = feedbackRef.where("userAccountId", "==", userAccountId);

    const feedbackQueryResult = await feedbackQuery.get();

    if (feedbackQueryResult.size >= 2) {
        logger.warn(`Feedback crossed the limit`);
        responseBody.message = `We're grateful for your feedback! It appears you've exceeded the maximum number of submissions allowed at this time. Your insights are valuable, and we encourage you to revisit us in the future if you have more feedback to offer.`;
        response.status(400).send(responseBody);
        return;
    }

    logger.info(`Feedback document about to be created`);

    await feedbackRef
        .add({
            feedback: feedback,
            userAccountId: userAccountId,
            submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
            logger.info(`Feedback document created`);
            responseBody.message = `Thank you for taking the time to share your feedback with us. We value your thoughts and will use them to enhance your experience.`;
            response.status(200).send(responseBody);
        })
        .catch((error) => {
            logger.error(`Feedback document could not be created. Error is ${error.message}`);
            responseBody.message = `We apologize for the inconvenience. It seems there was an issue submitting your feedback... Error ${error.message}`;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
