const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
// @ts-ignore
const { setGlobalOptions, firestore } = require("firebase-functions/v2");

setGlobalOptions({ maxInstances: 10 });
exports.onUserProfileUpdated = onDocumentUpdated(
  "/USER/PRIVATE_PROFILE/FILES/{userAccountId}",
  async (event) => {
    logger.log(`trigger onUpdate||on-user-profile-updated.`);
    const userProfileSnapshot = event.data;
    if (userProfileSnapshot == null) {
      logger.error(`log||no data associated with the event.`);
    }

    const afterUpdateSnapshot = userProfileSnapshot.after;
    const beforeUpdateSnapshot = userProfileSnapshot.before;

    const afterUpdateData = afterUpdateSnapshot.data();
    const beforeUpdateData = beforeUpdateSnapshot.data();

    if (
      afterUpdateData.emailAddress != null &&
      beforeUpdateData.emailAddress == null
    ) {
      const customClaim = {
        emailVerified: false,
      };

      const userAccountId = event.data.after.id;
      logger.log(
        `log||user account id is ${userAccountId} and email has been updated for first time.`,
      );
      await admin
        .auth()
        .setCustomUserClaims(userAccountId, customClaim)
        .then(async () => {
          logger.log(
            `log||user account id is ${userAccountId} and custom claim for email verified has been set to false.`,
          );
          const userProfilePath = `/USER/PRIVATE_PROFILE/FILES/${userAccountId}`;
          await admin.firestore().doc(userProfilePath).update({
            lastUpdatedOn: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
    }
  },
);
