const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
// @ts-ignore
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ maxInstances: 10 });
exports.onUserProfileDeleted = onDocumentDeleted(
  "/USER/PRIVATE_PROFILE/FILES/{userAccountId}",
  async (event) => {
    logger.log(`trigger onUpdate||on-user-profile-deleted.`);
    const userProfileSnapshot = event.data;
    if (userProfileSnapshot == null) {
      logger.error(`log||no data associated with the event.`);
    }

    const userAccountId = userProfileSnapshot.id;
    const singleDeviceLoginPath = `/SINGLE_DEVICE_LOGIN/${userAccountId}`;
    await admin.firestore().doc(singleDeviceLoginPath).delete();
    await admin.auth().deleteUser(userAccountId);
  },
);
