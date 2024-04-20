const express = require("express");
const router = express.Router();
const logger = require("firebase-functions/logger");
const {v4: uuidv4} = require("uuid");
const admin = require("firebase-admin");
const mailjet = require("node-mailjet").apiConnect(
    process.env.MAIL_JET_API_KEY,
    process.env.MAIL_JET_SECRET_KEY,
);

router.post("/", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

    const emailAddress = request.body.emailAddress || null;
    logger.log(`param||email address is : ${emailAddress}`);
    const firstName = request.body.firstName || null;
    logger.log(`param||first name is : ${firstName}`);

    const responseBody = {
        message: null,
        emailAddress: emailAddress,
    };

    if (emailAddress == null) {
        logger.error(`log||email address is null.`);

        responseBody.message = `Email address is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (firstName == null) {
        logger.error(`log||first name is null.`);

        responseBody.message = `First name is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    //check if user id is registered
    const userIdCheck = await admin
        .auth()
        .getUser(userAccountId)
        .then((result) => {
            logger.log(`log||User authenticated, user details ${result.toJSON()}`);
            return true;
        })
        .catch((error) => {
            logger.error(
                `log||user id is not authenticated. Error is ${error.message}`,
            );
            responseBody.message = `User id is not authenticated.`;
            return false;
        });

    if (userIdCheck !== true) {
        response.status(401).send(responseBody);
        return;
    }

    //check how many times the verification was requested by this user for this particular mail address (if more than 5 don't send any new verification)
    const primaryMailVerificationKeyPath = `/VERIFICATION/PRIMARY_MAIL/FILES/`;
    const primaryVerificationQuery = admin
        .firestore()
        .collection(primaryMailVerificationKeyPath)
        .where("emailAddress", "==", emailAddress)
        .where("userAccountId", "==", userAccountId);

    const primaryVerificationQueryResult = await primaryVerificationQuery.get();

    if (primaryVerificationQueryResult.size > 5) {
        logger.error(
            `log||too many verification request by user with userAccountId${userAccountId} for email address ${emailAddress}`,
        );

        responseBody.message = `Verification limit for ${emailAddress} has exceeded. Try a different email address.`;
        response.status(400).send(responseBody);
        return;
    }

    const verificationId = uuidv4();
    const updatedPrimaryMailVerificationKeyPath = `/VERIFICATION/PRIMARY_MAIL/FILES/${verificationId}`;
    const primaryMailVerificationRef = admin
        .firestore()
        .doc(updatedPrimaryMailVerificationKeyPath);

    const verificationData = {
        key: `KEY${verificationId}`,
        userAccountId: userAccountId,
        emailAddress: emailAddress,
    };

    await primaryMailVerificationRef.create(verificationData);

    //mail creation
    const templateId = 5772111;
    const verificationLink = `https://app.booleanbear.com/verification/primary-mail/verify-link?emailAddress=${emailAddress}&id=${userAccountId}&publicKey=${verificationData.key}`;

    const templateData = {
        firstName: firstName,
        verificationLink: verificationLink,
    };

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
            logger.log(
                `log||verification mail sent successfully to user ${firstName} with account id ${userAccountId} and email address ${emailAddress}`,
            );
            logger.log(`log||verification mail result ${result.response}`);

            responseBody.message = `Verification mail sent successfully`;

            return true;
        })
        .catch((error) => {
            logger.error(
                `log||failed to send verification mail to user ${firstName} with account id ${userAccountId} and email address ${emailAddress}`,
            );
            logger.log(`log||error is ${error.message}`);

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
