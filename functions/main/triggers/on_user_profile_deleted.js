const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const {onDocumentDeleted} = require("firebase-functions/v2/firestore");
// @ts-ignore
exports.onUserProfileDeleted = onDocumentDeleted(
    "/USERS/PRIVATE-PROFILES/FILES/{userAccountId}",
    async (event) => {
        logger.info(`Trigger onUpdate on-user-profile-deleted started`);
        const userProfileSnapshot = event.data;
        if (userProfileSnapshot == null) {
            logger.warn(`No data associated with event`);
        }
        const userAccountId = userProfileSnapshot.id;
        logger.info(`User account id is ${userAccountId}`);
        //store user data
        logger.info(`User profile about to be stored`);
        const deletedUsersPath = `USERS/DELETED/FILES/${userAccountId}`;
        await admin.firestore().doc(deletedUsersPath).set(event.data.data()).then(async () => {
            logger.info(`User profile stored`);
            logger.info(`Original user profile about to be deleted`);
            return await admin.firestore().doc(deletedUsersPath).update({
                deletedOn: admin.firestore.FieldValue.serverTimestamp()
            }).then((result) => {
                logger.info(`Original user profile deleted`);
            }).catch((error) => {
                logger.error(`Original user profile could not be deleted. Error is ${error.message}`);
            });
        }).catch((error) => {
            logger.error(`Duplicate user profile could not be created. Error is ${error.message}`);
        });

        //delete other user related data
        const singleDeviceLoginPath = `/USERS/SINGLE-DEVICE-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(singleDeviceLoginPath).delete();
        await admin.auth().deleteUser(userAccountId);
        const passwordPath = `/USERS/PASSWORDS/FILES/${userAccountId}`;
        await admin.firestore().doc(passwordPath).delete();
        const fcmTokenPath = `/USERS/FCM-TOKENS/FILES/${userAccountId}`;
        await admin.firestore().doc(fcmTokenPath).delete();
        logger.info(`Deleted all user associated documents`);

        const primaryEmailVerificationPath = `USERS/VERIFICATIONS/PRIMARY-MAILS/`;
        const primaryEmailVerificationCollectionRef = admin.firestore().collection(primaryEmailVerificationPath)
            .where("userAccountId", "==", userAccountId);

        const primaryVerificationQueryResult =
            await primaryEmailVerificationCollectionRef.get();

        if (!primaryVerificationQueryResult.empty) {
            logger.info(`Primary email verification document are present`);
            logger.info(`Primary email document about to be deleted. Entering loop. Estimated loop turn is ${primaryVerificationQueryResult.size}`);
            for (const snapshot of primaryVerificationQueryResult.docs) {
                const snapshotId = snapshot.id;
                try {
                    const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/${snapshotId}`;
                    const primaryMailVerificationRef = admin
                        .firestore()
                        .doc(primaryMailVerificationKeyPath);
                    await primaryMailVerificationRef.delete();
                    logger.info(`Primary email document deleted`);
                } catch (error) {
                    logger.error(`Primary email verification document could not be deleted. Document id is ${snapshotId}. Error is ${error.message}`);
                }
            }
            logger.info(`Exited from loop`);
        }
    },
);
