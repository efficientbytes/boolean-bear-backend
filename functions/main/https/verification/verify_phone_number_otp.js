const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
router.post("/", async (request, response) => {
    const phoneNumber = request.body.phoneNumber || null;
    const otp = request.body.otp || null;

    if (phoneNumber == null) {
        response.status(400).send({
            message: `Phone number is not provided`,
            phoneNumber: phoneNumber,
        });
        return;
    }

    if (otp == null) {
        response.status(400).send({
            message: `OTP is not provided`,
            phoneNumber: phoneNumber,
        });
        return;
    }
    ``;
    twilio.verify.v2
        .services(twilioServiceSid)
        .verificationChecks.create({to: `+91${phoneNumber}`, code: otp})
        .then((verification_check) => {
            if (verification_check.status === "approved") {
                response.status(200).send({
                    message: `Verification successful`,
                    phoneNumber: phoneNumber,
                });
            } else if (verification_check.status === "pending") {
                response.status(400).send({
                    message: `Verification failed`,
                    phoneNumber: phoneNumber,
                });
            }
        })
        .catch((error) => {
            logger.error(`verify-phone-number-otp||failed||http||error is ${error.message}`);
            response.status(503).send({
                message: `Verification error identifier ${error.code}`,
                phoneNumber: phoneNumber,
            });
        });
});

module.exports = router;
