const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/:linkId", async (request, response) => {
    logger.log(`http||get-mentioned-link-id.`);

    const mentionedLinkId = request.params.linkId || null;

    const responseBody = {
        mentionedLink: null,
        message: null,
    };

    if (mentionedLinkId == null) {
        logger.error(`log||mentioned link id cannot be null`);

        responseBody.message = `mentioned link id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const mentionedLinkPath = `/ASSETS/LINKS/FILES/${mentionedLinkId}`;
    const mentionedLinkRef = admin.firestore().doc(mentionedLinkPath);
    const mentionedLinkSnapshot = await mentionedLinkRef.get();

    if (!mentionedLinkSnapshot.exists) {
        logger.error(`log||mentioned link does not exists`);

        responseBody.message = `mentioned link does not exists.`;
        response.status(400).send(responseBody);
        return;
    }

    const mentionedLink = mentionedLinkSnapshot.data();
    responseBody.mentionedLink = {
        linkId: mentionedLinkId,
        link: mentionedLink.link,
        createdOn: mentionedLink.createdOn._seconds,
        name: mentionedLink.name,
    };
    responseBody.message = `Mentioned link successfully fetched.`

    response.status(200).send(responseBody);

});

module.exports = router;
