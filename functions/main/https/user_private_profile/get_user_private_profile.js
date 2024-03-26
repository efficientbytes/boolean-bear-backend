const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
  logger.log(`http||get-user-private-profile.`);

  const userAccountId = request.query.userAccountId || null;

  const responseBody = {
    userProfile: null,
    message: null,
    signOut: false,
  };

  if (userAccountId == null) {
    logger.error(`log||user account id could not be extracted.`);

    responseBody.userProfile = null;
    responseBody.message =
      "User account id could not be found. Try signing in again.";
    responseBody.signOut = false;
    response.status(404).send(responseBody);
    return;
  }

  const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
  const userProfileRef = admin.firestore().doc(userProfilePath);
  const userProfileSnapshot = await userProfileRef.get();

  if (!userProfileSnapshot.exists) {
    //user does not exits
    logger.error(
      `log||user account id is ${userAccountId}. User profile does not exists.`,
    );

    responseBody.userProfile = null;
    responseBody.message = "User profile does not exists.";
    responseBody.signOut = false;
    response.status(404).send(responseBody);
    return;
  }

  // user profile exits, so return the data associated with it
  logger.log(`log||user account id is ${userAccountId}. User profile exists.`);

  responseBody.signOut = false;
  responseBody.message = "User profile fetched successfully";

  const userProfile = userProfileSnapshot.data();
  responseBody.userProfile = {
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    emailAddress: userProfile.emailAddress,
    phoneNumber: userProfile.phoneNumber,
    phoneNumberPrefix: userProfile.phoneNumberPrefix,
    completePhoneNumber: userProfile.completePhoneNumber,
    userAccountId: userProfile.userAccountId,
    activityId: userProfile.activityId,
    profession: userProfile.profession,
    linkedInUsername: userProfile.linkedInUsername,
    gitHubUsername: userProfile.gitHubUsername,
    universityName: userProfile.universityName,
    createdOn: userProfile.createdOn._seconds,
    lastUpdatedOn: userProfile.createdOn._seconds,
  };

  response.status(200).send(responseBody);
});

module.exports = router;
