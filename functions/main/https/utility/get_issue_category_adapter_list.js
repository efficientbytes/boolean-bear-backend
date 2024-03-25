const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
  logger.log(`http||get-issue-category-adapter-list.`);

  const issueCategoryAdapterListPath = `/UTILITY/APP/ISSUE_CATEGORY/`;
  const issueCategoryAdapterListPathRef = admin
    .firestore()
    .collection(issueCategoryAdapterListPath);
  const issueCategoryAdapterListSnapshot =
    await issueCategoryAdapterListPathRef.get();
  const responseBody = [];

  if (issueCategoryAdapterListSnapshot.empty) {
    //issueCategory data not available

    logger.error(`log||issueCategory adapter list data is empty in database.`);
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
