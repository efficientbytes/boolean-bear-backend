const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {
    const title = request.body.title || null;
    const imageLink = request.body.imageLink || null;
    const redirectLink = request.body.redirectLink || null;
    const days = request.body.dayCount || null;

    const clickAble = redirectLink != null;

    const time = admin.firestore.FieldValue.serverTimestamp();
    const startingDate = time;
    const createdOn = time;

    const currentDate = new Date();
    let closingDateInMillis;

    if (days == null) {
        currentDate.setDate(currentDate.getDate() + 30);
        closingDateInMillis = currentDate.getTime();
    } else {

        const parsedDays = parseInt(days);

        if (!Number.isInteger(parsedDays)) {
            response.status(400).send({message: `The day count is not integer`});
            return;
        }

        currentDate.setDate(currentDate.getDate() + parsedDays);
        closingDateInMillis = currentDate.getTime();
    }

    const bannerPath = `/ASSETS/AD/HOME-PAGE-BANNER/`;
    const bannerCollectionRef = admin.firestore().collection(bannerPath);

    const bannerSnapshot = bannerCollectionRef.doc();

    const id = bannerSnapshot.id;

    const banner = {
        bannerId: id,
        title: title,
        imageLink: imageLink,
        clickAble: clickAble,
        redirectLink: redirectLink,
        createdOn: createdOn,
        startingDate: startingDate,
        closingDate: admin.firestore.Timestamp.fromDate(new Date(closingDateInMillis))
    }

    await bannerCollectionRef.add(banner).then((result) => {
        response.status(200).send({message: `Banner ID is ${id}`});
    }).catch((error) => {
        response.status(500).send({message: `Failed to upload. Error is ${error.message}`});
    });

});

module.exports = router;
