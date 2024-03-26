const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const { customAlphabet } = require("nanoid");

const router = express.Router();

router.post("/", async (request, response) => {
  logger.log(`http||request-support.`);

  const userAccountId = request.body.userAccountId || null;
  const completePhoneNumber = request.body.completePhoneNumber || null;
  const category = request.body.category || null;
  const title = request.body.title || null;
  const description = request.body.description || null;

  const responseBody = {
    ticketId: null,
    message: null,
  };

  const alphabets = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ticketIdGenerator = customAlphabet(alphabets, 10);
  const ticketId = ticketIdGenerator();

  const contactSupportPath = `/CONTACT_SUPPORT/APP/FILES/`;
  const contactSupportRef = admin.firestore().collection(contactSupportPath);
  const currentTime = admin.firestore.FieldValue.serverTimestamp();

  const requestSupport = {
    ticketId: ticketId,
    category: category,
    title: title,
    description: description,
    priority: 0,
    status: "OPEN",
    userAccountId: userAccountId,
    completePhoneNumber: completePhoneNumber,
    dateCreated: currentTime,
    dateUpdated: currentTime,
    resolution: null,
  };

  await contactSupportRef
    .doc(ticketId)
    .set(requestSupport)
    .then(() => {
      //successfully sent
      logger.log(
        `log|| issue submitted by user with user account id ${userAccountId}.`,
      );

      responseBody.ticketId = ticketId;
      responseBody.message = `Our dedicated support team will review your issue promptly and reach out to you as soon as possible. Please expect a call within the next 3 days between 10am and 7pm. Your feedback is invaluable in improving our service, and we appreciate your patience and cooperation in maintaining the integrity of our platform.`;

      response.status(200).send(responseBody);
    })
    .catch((error) => {
      logger.error(
        `log|| could not submit issue by user with user account id ${userAccountId}. Error : ${error.message}`,
      );

      responseBody.ticketId = null;
      responseBody.message = `We apologize for the inconvenience. It seems there was an issue submitting your issue... Error ${error.message}`;

      response.status(500).send(responseBody);
    });
});

module.exports = router;
