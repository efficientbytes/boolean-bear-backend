const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {v4: uuidv4} = require("uuid");
const mailjet = require("node-mailjet").apiConnect(
    process.env.MAIL_JET_API_KEY,
    process.env.MAIL_JET_SECRET_KEY,
);


exports.onUserProfileUpdated = onDocumentUpdated(
    "/USERS/PRIVATE-PROFILES/FILES/{userAccountId}",
    async (event) => {

        logger.info(`Trigger onUpdate onUserProfileUpdated started`);
        const userProfileSnapshot = event.data;
        if (userProfileSnapshot == null) {
            logger.warn(`No data associated with the event`);
            return;
        }
        logger.info(`User account id is ${userProfileSnapshot.after.id}`);

        const afterUpdateSnapshot = userProfileSnapshot.after;
        const beforeUpdateSnapshot = userProfileSnapshot.before;

        const afterUpdateData = afterUpdateSnapshot.data();
        const beforeUpdateData = beforeUpdateSnapshot.data();

        logger.info(`Before update email address is ${beforeUpdateData.emailAddress}`);
        logger.info(`After update email address is ${afterUpdateData.emailAddress}`);
        if (
            afterUpdateData.emailAddress != null &&
            beforeUpdateData.emailAddress == null
        ) {
            logger.info(`After update email is not null and before update email is null`);
            //first time when the user profile is created automatically during sign in as new user.
            // The custom claim has to be modified to - { email verified : false }

            const customClaim = {
                emailVerified: false,
            };

            const userAccountId = event.data.after.id;

            logger.info(`Custom claim about to be modified.`);
            const customClaimUpdateResult = await admin
                .auth()
                .setCustomUserClaims(userAccountId, customClaim)
                .then(() => {
                    logger.info(`Custom claim modified to {email verified : false}`);
                    return true;
                }).catch((error) => {
                    logger.error(`Custom claim could not be modified. Error is ${error.message}`);
                    return false;
                });

            if (!customClaimUpdateResult) return;

            const userProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
            const updateResult = await admin.firestore().doc(userProfilePath).update({
                lastUpdatedOn: admin.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                logger.info(`Field lastUpdatedOn updated`);
                return true;
            }).catch((error) => {
                logger.error(`Field lastUpdatedOn could not be updated. Error is ${error.message}`);
                return false;
            });

            if (!updateResult) return;

            const emailAddress = afterUpdateData.emailAddress;
            const firstName = afterUpdateData.firstName;

            logger.info(`Verification email to be sent to  email address ${emailAddress}. First name is ${firstName}`);

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
                }).then(result => {
                    logger.info(`Verification email sent`);
                }).catch((error) => {
                    logger.error(`Verification email could not be sent. Error is ${error.message}`);
                });

        }

        const currentEmailVerifiedOn = afterUpdateData.emailVerifiedOn._nanoseconds;
        const previousEmailVerifiedOn = beforeUpdateData.emailVerifiedOn._nanoseconds;

        logger.info(`Before update email verified on ${previousEmailVerifiedOn}`);
        logger.info(`After update email verified on ${currentEmailVerifiedOn}`);
        if ((currentEmailVerifiedOn != null && currentEmailVerifiedOn !== previousEmailVerifiedOn) || (currentEmailVerifiedOn != null && previousEmailVerifiedOn == null)) {
            logger.info(`Checking if there are primary email verification document present that needs to be deleted`);
            const userAccountId = event.data.after.id;

            const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/`;
            const primaryVerificationQuery = admin
                .firestore()
                .collection(primaryMailVerificationKeyPath)
                .where("userAccountId", "==", userAccountId);

            const primaryVerificationQueryResult =
                await primaryVerificationQuery.get();

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
            return;
        }

    },
);
