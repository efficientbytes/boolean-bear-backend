const express = require("express");
const router = express.Router();
const {v4: uuidv4} = require("uuid");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const mailjet = require("node-mailjet").apiConnect(
    process.env.MAIL_JET_API_KEY,
    process.env.MAIL_JET_SECRET_KEY,
);

router.post("/", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Authentication required.`});
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
    const firstName = request.body.firstName || null;

    const responseBody = {
        message: null,
        emailAddress: emailAddress,
    };

    if (emailAddress == null) {
        responseBody.message = `Email address is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (firstName == null) {
        responseBody.message = `First name is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    //check how many times the verification was requested by this user for this particular mail address (if more than 5 don't send any new verification)
    const primaryMailVerificationKeyPath = `/USER/VERIFICATIONS/PRIMARY-MAILS/`;
    const primaryVerificationQuery = admin
        .firestore()
        .collection(primaryMailVerificationKeyPath)
        .where("emailAddress", "==", emailAddress)
        .where("userAccountId", "==", userAccountId);

    const primaryVerificationQueryResult = await primaryVerificationQuery.get();

    if (primaryVerificationQueryResult.size > 5) {
        responseBody.message = `Verification limit for ${emailAddress} has exceeded. Try a different email address.`;
        response.status(400).send(responseBody);
        return;
    }

    const verificationId = uuidv4();
    const updatedPrimaryMailVerificationKeyPath = `/USER/VERIFICATIONS/PRIMARY-MAILS/${verificationId}`;
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
    const verificationLink = `https://verify.booleanbear.com/verification/primary-mail/verify-link?emailAddress=${emailAddress}&id=${userAccountId}&publicKey=${verificationData.key}`;

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
            responseBody.message = `Verification mail sent successfully`;
            return true;
        })
        .catch((error) => {
            logger.error(`send-verification-link-to-primary-mail||failed||http||error is ${error.message}`);
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
