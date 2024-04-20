const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    const responseBody = {
        banners: null,
        message: null
    }

    const currentTime = new Date();
    //const currentTimeInMillis = currentTime.getTime();

    const bannerPath = `/ASSETS/AD/HOME-PAGE-BANNER/`;
    const bannerCollectionRef = admin.firestore().collection(bannerPath);
    const bannerQuery = bannerCollectionRef.where(`closingDate`, `>=`, currentTime);
    const bannerQueryResult = await bannerQuery.get();

    if (bannerQueryResult.empty) {
        responseBody.message = `No banner ads available`;

        response.status(400).send(responseBody);
        return;
    }

    const bannerSnapshots = bannerQueryResult.docs;

    const list = [];

    bannerSnapshots.forEach(snapshot => {

        const banner = snapshot.data();
        list.push({
            bannerId: banner.bannerId,
            title: banner.title,
            imageLink: banner.imageLink,
            clickAble: banner.clickAble,
            redirectLink: banner.redirectLink,
            createdOn: banner.createdOn._seconds,
            startingDate: banner.startingDate._seconds,
            closingDate: banner.closingDate._seconds
        })

    });

    responseBody.banners = list;
    responseBody.message = `Successfully fetched all the banner ads`
    response.status(200).send(responseBody);

});

module.exports = router;
