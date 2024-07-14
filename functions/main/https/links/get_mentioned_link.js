const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.get("/:linkId", verifyAppCheckToken, verifyIdToken, async (request, response) => {

    const mentionedLinkId = request.params.linkId || null;

    const responseBody = {
        data: null,
        message: null,
    };

    if (mentionedLinkId == null) {
        responseBody.message = `mentioned link id cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (mentionedLinkId.trim() === "") {
        responseBody.message = `Invalid mentioned link id`;
        response.status(400).send(responseBody);
        return;
    }

    const mentionedLinkPath = `/ASSETS/LINKS/FILES/${mentionedLinkId}`;
    const mentionedLinkRef = admin.firestore().doc(mentionedLinkPath);
    const mentionedLinkSnapshot = await mentionedLinkRef.get();

    if (!mentionedLinkSnapshot.exists) {
        responseBody.message = `mentioned link does not exists.`;
        response.status(400).send(responseBody);
        return;
    }

    const mentionedLink = mentionedLinkSnapshot.data();
    responseBody.data = {
        linkId: mentionedLinkId,
        link: mentionedLink.link,
        createdOn: mentionedLink.createdOn._seconds,
        name: mentionedLink.name,
    };
    responseBody.message = `Mentioned link successfully fetched.`
    response.status(200).send(responseBody);

});

module.exports = router;
