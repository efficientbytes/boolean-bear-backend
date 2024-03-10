const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.post("/", async (request, response) => {
  logger.log(`http||update-user-profile-basic-details.`);

  const userAccountId = request.body.userAccountId || null;

  const firstName = request.body.firstName || null;
  const lastName = request.body.lastName || null;
  const emailAddress = request.body.emailAddress || null;
  const profession = request.body.profession || null;

  const responseBody = {
    userProfile: null,
    message: null,
    signOut: true,
  };

  if (userAccountId == null) {
    logger.error(`log||user account id could not be extracted.`);

    responseBody.userProfile = null;
    responseBody.message =
      "User account id could not be found. Try signing in again.";
    responseBody.signOut = true;
    response.status(404).send(responseBody);
  }

  if (firstName == null || emailAddress == null) {
    logger.error(
      `log||user account id is ${userAccountId}. User first name or email address is not provided.`,
    );

    responseBody.userProfile = null;
    responseBody.message = "First name or Email address is not provided.";
    responseBody.signOut = false;
    response.status(404).send(responseBody);
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
    responseBody.signOut = true;
    response.status(404).send(responseBody);
  }

  // user profile exits, so update the fields
  logger.log(`log||user account id is ${userAccountId}. User profile exists.`);
  await userProfileRef
    .update({
      firstName: firstName,
      lastName: lastName,
      emailAddress: emailAddress,
      profession: profession,
    })
    .then((result) => {
      logger.log(
        `log||user account id is ${userAccountId}. User profile was updated at ${result.writeTime.toDate()}.`,
      );

      responseBody.message = "User profile has been updated.";
      responseBody.signOut = false;
    })
    .catch((error) => {
      logger.log(
        `log||user account id is ${userAccountId}. User profile could not be updated. Catch error is ${error.message}`,
      );

      responseBody.userProfile = null;
      responseBody.message = `User profile could not be updated. Error is ${error.message}`;
      responseBody.signOut = false;
      response.status(500).send(responseBody);
    });

  const updatedUserProfileSnapshot = await userProfileRef.get();
  const userProfile = updatedUserProfileSnapshot.data();
  responseBody.userProfile = {
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    emailAddress: userProfile.emailAddress,
    phoneNumber: userProfile.phoneNumber,
    phoneNumberPrefix: userProfile.phoneNumberPrefix,
    completePhoneNumber: userProfile.completePhoneNumber,
    userAccountId: userProfile.userAccountId,
    activityId: userProfile.activityId,
    fcmToken: userProfile.fcmToken,
    profession: userProfile.profession,
    linkedInUsername: userProfile.linkedInUsername,
    gitHubUserName: userProfile.gitHubUserName,
    universityName: userProfile.universityName,
    createdOn: userProfile.createdOn._seconds,
    lastUpdatedOn: userProfile.createdOn._seconds,
  };

  response.status(200).send(responseBody);
});

module.exports = router;
