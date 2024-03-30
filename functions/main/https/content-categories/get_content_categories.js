const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();
router.get("/", async (request, response) => {
    logger.log(`http||get-content-categories.`);

    const responseBody = {
        message: null,
        categoryList: null
    };

    const categoriesPath = `/ASSETS/CATEGORIES/FILES/`;
    const categoryRef = admin.firestore().collection(categoriesPath);

    try {

        const categoriesResult = await categoryRef.get();

        if (categoriesResult.empty) {
            logger.error(`log||There are no categories`);

            responseBody.message = `There are no categories`;
            responseBody.categoryList = null;
            response.status(404).send(responseBody);
            return;
        }

        const categoriesList = []
        for (const categorySnapshot of categoriesResult.docs) {

            const category = categorySnapshot.data();

            const contentCategory = {
                id: category.id,
                index: category.index,
                title: category.title,
                caption: category.caption,
                contentCount: category.contentCount,
                deepLink: category.deepLink,
                type1Thumbnail: category.type1Thumbnail,
                contentIds: category.contentIds,
                searchTags: category.searchTags,
                dateCreated: category.dateCreated._seconds,
                dateModified: category.dateModified._seconds
            }

            categoriesList.push(contentCategory);
        }

        responseBody.message = `Successfully fetched all content categories`;
        responseBody.categoryList = categoriesList;
        response.status(200).send(responseBody);

    } catch (error) {
        logger.error(`log||Error fetching content categories.`);

        responseBody.message = error.message;
        responseBody.categoryList = null;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
