const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

class Category {
    constructor(title, index = null, id = null, caption = null, contentCount = null, deepLink = null, type1Thumbnail = null, contentIds = null, searchTags = null, dateCreated = null, dateModified = null) {
        this.id = id;
        this.index = index;
        this.title = title;
        this.caption = caption;
        this.contentCount = contentCount;
        this.deepLink = deepLink;
        this.type1Thumbnail = type1Thumbnail;
        this.contentIds = contentIds;
        this.searchTags = searchTags;
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
    }
}

router.get("/", async (request, response) => {
    logger.log(`http||create-content-categories.`);

    const responseBody = {
        message: null,
    };

    const categoriesData = [
        new Category("Kotlin", 1),
        new Category("Git", 2),
        new Category("Podcasts", 9),
        new Category("Kotlin multiplatform", 7),
        new Category("Figma", 3),
        new Category("Android XML", 6),
        new Category("Android Compose", 4),
        new Category("Backend Development", 5),
        new Category("Desktop Development", 8)
    ];

    const categoriesPath = `/ASSETS/CATEGORIES/FILES/`;
    const categoryRef = admin.firestore().collection(categoriesPath);
    const time = admin.firestore.FieldValue.serverTimestamp();
    try {
        for (const category of categoriesData) {
            const categoryId = categoryRef.doc().id;
            category.id = categoryId;
            await categoryRef.doc(categoryId).set({
                id: category.id,
                index: category.index,
                title: category.title,
                caption: "",
                contentCount: 2,
                deepLink: "",
                type1Thumbnail: "",
                contentIds: ["", ""],
                searchTags: ["", ""],
                dateCreated: time,
                dateModified: time
            })
            ;
        }
        logger.log(`log|| Categories have been successfully uploaded.`);
        responseBody.message = `Categories have been successfully uploaded.`;
        response.status(200).send(responseBody);
    } catch (error) {
        logger.error(`log|| Error uploading categories.`);
        responseBody.message = `Could not upload the categories, Error is ${error.message}`;
        response.status(500).send(responseBody);
    }

});

module.exports = router;
