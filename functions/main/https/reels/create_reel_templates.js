const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {

    const count = request.query.count || 10;
    const instructorId = request.query.instructorId || "d60cb1a8-d359-45d4-ac20-7ae605c24ecc";

    const reelPath = `/ASSETS/REELS/FILES/`;
    const reelCollectionRef = admin.firestore().collection(reelPath);

    let parsedCount = 10;

    if (typeof count === 'string') {
        const num = parseInt(count.toString(), 10);
        if (!isNaN(num)) {
            parsedCount = num
        }
    }

    const template = {
        createdOn: admin.firestore.FieldValue.serverTimestamp(),
        updatedOn: admin.firestore.FieldValue.serverTimestamp(),
        videoId: "",
        reelId: null,
        title: "",
        description: "",
        showAds: true,
        nextReelId: null,
        instructorId: instructorId,
        hashTags: ["", "", "", "", ""],
        mentionedLinkIds: ["", "", "", "", ""],
    }

    for (let i = 1; i <= parsedCount; i++) {

        template.reelId = reelCollectionRef.doc().id;
        await reelCollectionRef.doc(template.reelId).set(template);

    }

    response.status(200);

});

module.exports = router;
