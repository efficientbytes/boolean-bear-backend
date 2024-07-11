const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

router.get("/", verifyAppCheckToken, async (request, response) => {
    const professionsAdapterListPath = `/UTILITIES/APP/PROFESSIONS/`;
    const professionAdapterListPathRef = admin
        .firestore()
        .collection(professionsAdapterListPath);
    const professionAdapterListSnapshot =
        await professionAdapterListPathRef.get();
    const responseBody = [];

    if (professionAdapterListSnapshot.empty) {
        response.status(500).send(responseBody);
        return;
    }

    await professionAdapterListSnapshot.forEach((snapshot) => {
        const professionData = snapshot.data();
        responseBody.push({
            index: professionData.index,
            name: professionData.name,
        });
    });

    response.status(200).send(responseBody);
});

module.exports = router;
