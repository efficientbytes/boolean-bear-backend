const admin = require("firebase-admin");
const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
router.get("/", async (request, response) => {
    const type = request.query.type || "shuffled";

    const responseBody = {
        message: null,
        data: null
    };

    if (type === "shuffled") {

        const categoriesPath = `/ASSETS/CATEGORIES/SHUFFLED/`;
        const categoryRef = admin.firestore().collection(categoriesPath);

        try {

            const categoriesResult = await categoryRef.get();

            if (categoriesResult.empty) {
                responseBody.message = `There are no categories`;
                responseBody.data = null;
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
            responseBody.data = categoriesList;
            response.status(200).send(responseBody);

        } catch (error) {
            logger.error(`get-categories||failed||http||shuffled||error is ${error.message}`);
            responseBody.message = error.message;
            responseBody.data = null;
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
                responseBody.message = `There are no categories`;
                responseBody.data = null;
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
            responseBody.data = categoriesList;
            response.status(200).send(responseBody);

        } catch (error) {
            logger.error(`get-categories||failed||http||curated||error is ${error.message}`);
            responseBody.message = error.message;
            responseBody.data = null;
            response.status(500).send(responseBody);
        }

        return;
    }

});

module.exports = router;
