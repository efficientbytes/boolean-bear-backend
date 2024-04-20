const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    const issueCategoryAdapterListPath = `/UTILITY/APP/ISSUE_CATEGORY/`;
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
