const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();
router.get("/:type", async (request, response) => {
    logger.log(`http||get-content-categories.`);


    const type = request.params.type || "shuffled";

    const responseBody = {
        message: null,
        categoryList: null
    };

    if (type === "shuffled") {

        const categoriesPath = `/ASSETS/CATEGORIES/SHUFFLED/`;
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
                    dateModified: category.dateModified._seconds,
                    categoryType: "SHUFFLED"
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

        return;
    }

    if (type === "curated") {

        const categoriesPath = `/ASSETS/CATEGORIES/CURATED/`;
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
                    curatedContentIds: category.curatedContentIds,
                    searchTags: category.searchTags,
                    dateCreated: category.dateCreated._seconds,
                    dateModified: category.dateModified._seconds,
                    categoryType: "CURATED"
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

        return;
    }

});

module.exports = router;
