const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.get("/", verifyAppCheckToken, async (request, response) => {
    const issueCategoryAdapterListPath = `/UTILITIES/APP/ISSUE-CATEGORIES/`;
    const issueCategoryAdapterListPathRef = admin
        .firestore()
        .collection(issueCategoryAdapterListPath);
    const issueCategoryAdapterListSnapshot =
        await issueCategoryAdapterListPathRef.get();
    const responseBody = [];

    if (issueCategoryAdapterListSnapshot.empty) {
        response.status(500).send(responseBody);
        return;
    }

    await issueCategoryAdapterListSnapshot.forEach((snapshot) => {
        const issueCategoryData = snapshot.data();
        responseBody.push({
            index: issueCategoryData.index,
            name: issueCategoryData.name,
        });
    });

    response.status(200).send(responseBody);
});

module.exports = router;
