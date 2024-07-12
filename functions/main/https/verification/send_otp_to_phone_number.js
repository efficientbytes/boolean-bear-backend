const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
const {verifyAppCheckToken} = require("own_modules/verify_app_check_token.js");

class User {
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

router.post("/", verifyAppCheckToken, async (request, response) => {
    logger.info(`API send_otp_to_phone_number started`);
    const phoneNumber = request.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = request.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        logger.warn(`Phone number is not supplied`);
        responseBody.message = `Phone number is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        logger.warn(`Prefix is not supplied`);
        responseBody.message = `Prefix is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber) {
            responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
            responseBody.data.prefix = prefix;
            responseBody.data.phoneNumber = phoneNumber;
            response.status(200).send(responseBody);
            return;
        }
    }

    logger.info(`OTP about to be sent to ${prefix}${phoneNumber}`);
    twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then((verification) => {
            if (verification.status === "pending") {
                logger.info(`OTP sent to ${prefix}${phoneNumber}`);
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                responseBody.data.prefix = prefix;
                responseBody.data.phoneNumber = phoneNumber;
                response.status(200).send(responseBody);
            } else {
                logger.warn(`OTP status for ${prefix}${phoneNumber} is ${verification.status}`);
            }
        })
        .catch((error) => {
            logger.error(`OTP could not be sent to ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.message = `OTP request failed. Error code ${error.code}`;
            response.status(503).send(responseBody);
        });
});

module.exports = router;
