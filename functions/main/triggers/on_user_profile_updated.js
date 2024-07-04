const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {v4: uuidv4} = require("uuid");
const mailjet = require("node-mailjet").apiConnect(
    process.env.MAIL_JET_API_KEY,
    process.env.MAIL_JET_SECRET_KEY,
);


exports.onUserProfileUpdated = onDocumentUpdated(
    "/USER/PRIVATE-PROFILE/FILES/{userAccountId}",
    async (event) => {

        logger.log(`trigger onUpdate||on-user-profile-updated.`);
        const userProfileSnapshot = event.data;
        if (userProfileSnapshot == null) {
            logger.error(`log||no data associated with the event.`);
            return;
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

            const customClaimUpdateResult = await admin
                .auth()
                .setCustomUserClaims(userAccountId, customClaim)
                .then(() => {
                    logger.log(
                        `log||user account id is ${userAccountId} and custom claim for email verified has been set to false.`,
                    );
                    return true;
                }).catch(() => {
                    return false;
                });

            if (!customClaimUpdateResult) return;

            const userProfilePath = `/USER/PRIVATE-PROFILE/FILES/${userAccountId}`;
            const updateResult = await admin.firestore().doc(userProfilePath).update({
                lastUpdatedOn: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                return true;
            }).catch(() => {
                return false;
            });

            if (!updateResult) return;

            const emailAddress = afterUpdateData.emailAddress;
            const firstName = afterUpdateData.firstName;

            const verificationId = uuidv4();
            const updatedPrimaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/${verificationId}`;
            const primaryMailVerificationRef = admin
                .firestore()
                .doc(updatedPrimaryMailVerificationKeyPath);

            const time = admin.firestore.FieldValue.serverTimestamp();
            const verificationData = {
                key: `KEY${verificationId}`,
                userAccountId: userAccountId,
                emailAddress: emailAddress,
                createdOn: time
            };

            await primaryMailVerificationRef.create(verificationData);

            //mail creation
            const templateId = 5772111;
            const verificationLink = `https://verify.booleanbear.com/verification/primary-mail/verify-link?emailAddress=${emailAddress}&id=${userAccountId}&publicKey=${verificationData.key}`;

            const templateData = {
                firstName: firstName,
                verificationLink: verificationLink,
            };

            await mailjet
                .post("send", {version: "v3.1"})
                .request({
                    Messages: [
                        {
                            From: {
                                Email: "donotreply@booleanbear.com",
                                Name: "boolean bear",
                            },
                            To: [
                                {
                                    Email: emailAddress,
                                    Name: firstName,
                                },
                            ],
                            TemplateID: templateId,
                            TemplateLanguage: true,
                            Variables: templateData,
                        },
                    ],
                }).catch((error) => {
                    logger.error(`send-verification-link-to-primary-mail||failed||trigger||error is ${error.message}`);
                });

        }

        const currentEmailVerifiedOn = afterUpdateData.emailVerifiedOn._nanoseconds;
        const previousEmailVerifiedOn = beforeUpdateData.emailVerifiedOn._nanoseconds;

        if (currentEmailVerifiedOn != null && currentEmailVerifiedOn !== previousEmailVerifiedOn) {

            const userAccountId = event.data.after.id;

            const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/`;
            const primaryVerificationQuery = admin
                .firestore()
                .collection(primaryMailVerificationKeyPath)
                .where("userAccountId", "==", userAccountId);

            const primaryVerificationQueryResult =
                await primaryVerificationQuery.get();

            if (!primaryVerificationQueryResult.empty) {
                logger.log(
                    `log||there are ${primaryVerificationQueryResult.size} verification credentials request created for user with user account id ${userAccountId}`,
                );
                logger.log(`log||deleting verification credentials...`);
                for (const snapshot of primaryVerificationQueryResult.docs) {
                    const snapshotId = snapshot.id;
                    try {
                        const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/${snapshotId}`;
                        const primaryMailVerificationRef = admin
                            .firestore()
                            .doc(primaryMailVerificationKeyPath);
                        await primaryMailVerificationRef.delete();
                    } catch (error) {
                        logger.error(
                            `log||failed to delete document id ${snapshotId}. Error ${error.message}`,
                        );
                    }
                }
                logger.log(
                    `log||verification credentials deletion completed for user with user account id ${userAccountId}`,
                );
                const updatedQueryResult = await primaryVerificationQuery.get();
                const updatedSize = updatedQueryResult.size;
                logger.log(
                    `log||verification credentials deletion completed for user with user account id ${userAccountId}. Documents present after deletion ${updatedSize}`,
                );
            }
            return;
        }

    },
);
