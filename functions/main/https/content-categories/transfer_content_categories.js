const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {

    const responseBody = {
        message: null,
    };

    const categoriesPath = `/ASSETS/CATEGORIES/SHUFFLED/`;
    const categoryRef = admin.firestore().collection(categoriesPath);
    const categoryQueryResult = await categoryRef.get();

    const categorySnapshots = categoryQueryResult.docs;

    const time = admin.firestore.FieldValue.serverTimestamp();

    const reelsTopicPath = `/ASSETS/REELS/TOPICS/`;
    const reelTopicRef = admin.firestore().collection(reelsTopicPath);

    for (const category of categorySnapshots) {

        const categoryData = category.data();

        const reel = {
            topicId: category.id,
            displayIndex: categoryData.index,
            topic: categoryData.title,
            description: categoryData.caption,
            hashTags: categoryData.searchTags,
            type1Thumbnail: categoryData.type1Thumbnail,
            type2Thumbnail: "",
            dateCreated: time,
            dateModified: time
        }

        await reelTopicRef.doc(reel.topicId).set(reel);

    }

    responseBody.message = "Successfully transferred"
    response.status(200).send(responseBody);
});

module.exports = router;
