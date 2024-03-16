const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
  logger.log(`http||get-profession-adapter-list.`);

  const professionsAdapterListPath = `/UTILITY/APP/PROFESSIONS/`;
  const professionAdapterListPathRef = admin
    .firestore()
    .collection(professionsAdapterListPath);
  const professionAdapterListSnapshot =
    await professionAdapterListPathRef.get();
  const responseBody = [];

  if (professionAdapterListSnapshot.empty) {
    //profession data not available

    logger.error(`log||profession adapter list data is empty in database.`);
    response.status(500).send(responseBody);
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
