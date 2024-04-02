const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/:categoryId", async (request, response) => {
    logger.log(`http||get-shuffled-content-ids.`);

    const categoryId = request.params.categoryId || null;

    const responseBody = {
        contentIds: null,
        message: null
    }

    if (categoryId == null) {

        responseBody.contentIds = null;
        responseBody.message = `Category id is not provided.`;

        response.status(400).send(responseBody);
        return;
    }

    //get all the content id under the particular category
    const categoryPath = `/ASSETS/CATEGORIES/SHUFFLED/${categoryId}`;
    const categoryRef = admin.firestore().doc(categoryPath);

    const categoryQueryResult = await categoryRef.get();

    if (!categoryQueryResult.exists) {

        responseBody.contentIds = null;
        responseBody.message = `${categoryId} category does not exists.`;

        response.status(400).send(responseBody);
        return;
    }

    const category = categoryQueryResult.data();

    responseBody.message = `Successfully fetched content ids for ${category.title} category`;
    responseBody.contentIds = category.contentIds;

    response.status(200).send(responseBody);

});

module.exports = router;
