const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.get("/:linkId", verifyAppCheckToken, async (request, response) => {
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
