const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {
  logger.log(`http||post-feedback.`);

  const userAccountId = request.body.userAccountId || null;
  const feedback = request.body.feedback || null;

  const responseBody = {
    userAccountId: null,
    feedback: null,
    message: null,
  };

  if (userAccountId == null) {
    logger.error(`log||user account id could not be extracted.`);

    responseBody.userAccountId = userAccountId;
    responseBody.message =
      "User account id could not be found. Try signing in again.";
    responseBody.feedback = null;

    response.status(404).send(responseBody);
    return;
  }

  const feedbackPath = `/FEEDBACK/APP/FILES/`;
  const feedbackRef = admin.firestore().collection(feedbackPath);

  const feedbackQuery = feedbackRef.where("userAccountId", "==", userAccountId);

  const feedbackQueryResult = await feedbackQuery.get();

  if (feedbackQueryResult.size >= 3) {
    logger.error(
      `log|| too many feedback by user with user account id ${userAccountId}`,
    );

    responseBody.feedback = feedback;
    responseBody.userAccountId = userAccountId;
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
      //successfully sent
      logger.log(
        `log|| feedback submitted by user with user account id ${userAccountId}.`,
      );

      responseBody.feedback = feedback;
      responseBody.userAccountId = userAccountId;
      responseBody.message = `Thank you for taking the time to share your feedback with us. We value your thoughts and will use them to enhance your experience.`;

      response.status(200).send(responseBody);
    })
    .catch((error) => {
      logger.error(
        `log|| could not submit feedback by user with user account id ${userAccountId}. Error : ${error.message}`,
      );

      responseBody.feedback = feedback;
      responseBody.userAccountId = userAccountId;
      responseBody.message = `We apologize for the inconvenience. It seems there was an issue submitting your feedback... Error ${error.message}`;

      response.status(500).send(responseBody);
    });
});

module.exports = router;
