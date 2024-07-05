const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const {onDocumentDeleted} = require("firebase-functions/v2/firestore");
// @ts-ignore
exports.onUserProfileDeleted = onDocumentDeleted(
    "/USERS/PRIVATE-PROFILES/FILES/{userAccountId}",
    async (event) => {
        logger.log(`trigger onUpdate||on-user-profile-deleted.`);
        const userProfileSnapshot = event.data;
        if (userProfileSnapshot == null) {
            logger.error(`log||no data associated with the event.`);
        }

        const userAccountId = userProfileSnapshot.id;
        const singleDeviceLoginPath = `/USERS/SINGLE-DEVICE-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(singleDeviceLoginPath).delete();
        await admin.auth().deleteUser(userAccountId);
        const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
        await admin.firestore().doc(passwordPath).delete();
        const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(fcmTokenPath).delete();
    },
);
