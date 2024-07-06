const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {

    const count = request.query.count || 20;

    const mentionedLinksPath = `/ASSETS/LINKS/FILES/`;
    const mentionedLinksCollectionRef = admin.firestore().collection(mentionedLinksPath);

    let parsedCount = 20;

    if (typeof count === 'string') {
        const num = parseInt(count.toString(), 10);
        if (!isNaN(num)) {
            parsedCount = num
        }
    }

    const template = {
        createdOn: admin.firestore.FieldValue.serverTimestamp(),
        link: "",
        linkId: "",
        name: "",
    }

    for (let i = 1; i <= parsedCount; i++) {

        template.linkId = mentionedLinksCollectionRef.doc().id;
        await mentionedLinksCollectionRef.doc(template.linkId).set(template);

    }

    response.status(200);

});

module.exports = router;
