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

        //store user data
        const deletedUsersPath = `USERS/DELETED/FILES/${userAccountId}`;
        await admin.firestore().doc(deletedUsersPath).set(event.data.data()).then(async () => {

            return await admin.firestore().doc(deletedUsersPath).update({
                deletedOn: admin.firestore.FieldValue.serverTimestamp()
            })

        });

        //delete other user related data
        const singleDeviceLoginPath = `/USERS/SINGLE-DEVICE-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(singleDeviceLoginPath).delete();
        await admin.auth().deleteUser(userAccountId);
        const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
        await admin.firestore().doc(passwordPath).delete();
        const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(fcmTokenPath).delete();

        const primaryEmailVerificationPath = `USERS/VERIFICATIONS/PRIMARY-MAILS/`;
        const primaryEmailVerificationCollectionRef = admin.firestore().collection(primaryEmailVerificationPath)
            .where("userAccountId", "==", userAccountId);

        const primaryVerificationQueryResult =
            await primaryEmailVerificationCollectionRef.get();

        if (!primaryVerificationQueryResult.empty) {
            for (const snapshot of primaryVerificationQueryResult.docs) {
                const snapshotId = snapshot.id;
                try {
                    const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/${snapshotId}`;
                    const primaryMailVerificationRef = admin
                        .firestore()
                        .doc(primaryMailVerificationKeyPath);
                    await primaryMailVerificationRef.delete();
                } catch (error) {

                }
            }
        }
    },
);
