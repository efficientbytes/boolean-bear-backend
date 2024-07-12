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
    logger.info(`API verify_phone_number_otp started`);
    const phoneNumber = request.body.phoneNumber || null;
    logger.info(`Phone number is ${phoneNumber}`);
    const prefix = request.body.prefix || null;
    logger.info(`Prefix is ${prefix}`);
    const otp = request.body.otp || null;
    logger.info(`OTP is ${otp}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        logger.warn(`Phone number not provided`);
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        logger.warn(`Prefix not provided`);
        response.status(400).send(responseBody);
        return;
    }

    if (otp == null) {
        logger.warn(`OTP not provided`);
        response.status(400).send(responseBody);
        return;
    }

    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber && user.otp === otp) {
            responseBody.message = `Verification successful`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(200).send(responseBody);
            return;
        } else if (user.phoneNumber === phoneNumber && user.otp !== otp) {
            responseBody.message = `Verification failed`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(400).send(responseBody);
            return;
        }
    }

    logger.info(`Verifying otp ${otp} requested by ${prefix}${phoneNumber}`);
    await twilio.verify.v2
        .services(twilioServiceSid)
        .verificationChecks.create({to: `${prefix}${phoneNumber}`, code: otp})
        .then((verification_check) => {
            if (verification_check.status === "approved") {
                logger.info(`OTP verified for ${prefix}${phoneNumber}`);
                responseBody.message = `Verification successful`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(200).send(responseBody);
            } else if (verification_check.status === "pending") {
                logger.warn(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}`);
                responseBody.message = `Verification failed`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(400).send(responseBody);
            }
            logger.warn(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}. Status is ${verification_check.status}`);
        })
        .catch((error) => {
            logger.error(`Verifying otp ${otp} failed. Requested by ${prefix}${phoneNumber}. Error is ${error.message}. Error code is ${error.code}`);
            responseBody.message = `OTP verification failed. Error code ${error.code}`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(503).send(responseBody);
        });
});

module.exports = router;
