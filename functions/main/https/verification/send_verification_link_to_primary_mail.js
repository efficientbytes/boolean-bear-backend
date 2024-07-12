const express = require("express");
const router = express.Router();
const {v4: uuidv4} = require("uuid");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const mailjet = require("node-mailjet").apiConnect(
    process.env.MAIL_JET_API_KEY,
    process.env.MAIL_JET_SECRET_KEY,
);
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");
const {verifyIdToken} = require("own_modules/verify_id_token.js");

router.post("/", verifyAppCheckToken, verifyIdToken, async (request, response) => {
    logger.info(`API send_verification_link_to_primary_mail started`);
    const userAccountId = request.userAccountId;
    logger.info(`User account id is ${userAccountId}`);
    const emailAddress = request.body.emailAddress || null;
    logger.info(`Email address is ${emailAddress}`);
    const firstName = request.body.firstName || null;
    logger.info(`First name is ${firstName}`);

    const responseBody = {
        message: null,
        emailAddress: emailAddress,
    };

    if (emailAddress == null) {
        logger.warn(`Email address is not supplied`);
        responseBody.message = `Email address is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (firstName == null) {
        logger.warn(`First name is not supplied`);
        responseBody.message = `First name is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    //check how many times the verification was requested by this user for this particular mail address (if more than 5 don't send any new verification)
    const primaryMailVerificationKeyPath = `/USERS/VERIFICATIONS/PRIMARY-MAILS/`;
    const primaryVerificationQuery = admin
        .firestore()
        .collection(primaryMailVerificationKeyPath)
        .where("emailAddress", "==", emailAddress)
        .where("userAccountId", "==", userAccountId);

    const primaryVerificationQueryResult = await primaryVerificationQuery.get();

    if (primaryVerificationQueryResult.size > 5) {
        logger.warn(`Primary email verification limit crossed by ${emailAddress} with user account id is ${userAccountId}`);
        responseBody.message = `Verification limit for ${emailAddress} has exceeded. Try a different email address.`;
        response.status(400).send(responseBody);
        return;
    }

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

    logger.info(`Primary email verification document about to be created`);
    await primaryMailVerificationRef.create(verificationData).then(() => {
        logger.info(`Primary email verification document created for email address ${emailAddress} with user account id ${userAccountId}`);
    }).catch((error) => {
        logger.error(`Primary email verification document could not be created for email address ${emailAddress} with user account id is ${userAccountId}. Error is ${error.message}`);
    });

    //mail creation
    const templateId = 5772111;
    const verificationLink = `https://verify.booleanbear.com/verification/primary-mail/verify-link?emailAddress=${emailAddress}&id=${userAccountId}&publicKey=${verificationData.key}`;

    const templateData = {
        firstName: firstName,
        verificationLink: verificationLink,
    };

    logger.info(`Primary email about to be sent to email address ${emailAddress} with user account id is ${userAccountId}`);
    const mailResult = await mailjet
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
        })
        .then((result) => {
            logger.info(`Primary email verification sent to email address ${emailAddress} with user account id is ${userAccountId}`);
            responseBody.message = `Verification mail sent successfully`;
            return true;
        })
        .catch((error) => {
            logger.error(`Primary email verification could not be sent to email address ${emailAddress} with user account id is ${userAccountId}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.message = `Error code ${error.code} : ${error.message}`;
            return false;
        });

    if (mailResult === true) {
        response.status(200).send(responseBody);
    } else {
        response.status(500).send(responseBody);
    }
});

module.exports = router;
