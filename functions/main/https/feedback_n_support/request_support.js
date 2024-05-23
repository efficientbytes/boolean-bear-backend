const admin = require("firebase-admin");
const express = require("express");
const {customAlphabet} = require("nanoid");
const {logger} = require("firebase-functions");

const router = express.Router();

router.post("/", async (request, response) => {
    const userAccountId = request.body.userAccountId || null;
    const prefix = request.body.prefix || null;
    const phoneNumber = request.body.phoneNumber || null;
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

    const contactSupportPath = `/CONTACT-SUPPORT/APP/FILES/`;
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
        completePhoneNumber: `${prefix}${phoneNumber}`,
        dateCreated: currentTime,
        dateUpdated: currentTime,
        resolution: null,
    };

    await contactSupportRef
        .doc(ticketId)
        .set(requestSupport)
        .then(() => {
            responseBody.ticketId = ticketId;
            responseBody.message = `Our dedicated support team will review your issue promptly and reach out to you as soon as possible. Please expect a call within the next 3 days between 10am and 7pm. Your feedback is invaluable in improving our service, and we appreciate your patience and cooperation in maintaining the integrity of our platform.`;
            response.status(200).send(responseBody);
        })
        .catch((error) => {
            logger.error(`request-support||failed||http||error is ${error.message}`);
            responseBody.ticketId = null;
            responseBody.message = `We apologize for the inconvenience. It seems there was an issue submitting your issue... Error ${error.message}`;
            response.status(500).send(responseBody);
        });
});

module.exports = router;
