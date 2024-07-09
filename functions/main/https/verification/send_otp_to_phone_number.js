const express = require("express");
const {logger} = require("firebase-functions");
const router = express.Router();
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);

class User {
    constructor(username, phoneNumber, otp) {
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.otp = otp;
    }
}

router.post("/", async (request, response) => {

    const phoneNumber = request.body.phoneNumber || null;
    const prefix = request.body.prefix || null;

    logger.info(`OTP requested. Prefix is ${prefix}, Phone number is ${phoneNumber}`);

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        responseBody.message = `Phone number is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
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
            responseBody.message = `OTP has been sent ${prefix}${phoneNumber}`;
            responseBody.data.prefix = prefix;
            responseBody.data.phoneNumber = phoneNumber;
            response.status(200).send(responseBody);
            return;
        }
    }

    twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `${prefix}${phoneNumber}`, channel: "sms"})
        .then((verification) => {
            if (verification.status === "pending") {
                responseBody.message = `OTP has been sent to ${prefix}${phoneNumber}`;
                responseBody.data.prefix = prefix;
                responseBody.data.phoneNumber = phoneNumber;
                logger.info(`OTP Sent to phone number ${prefix}${phoneNumber}.`);
                response.status(200).send(responseBody);
            }
        })
        .catch((error) => {
            logger.error(`OTP generation failed. Message ${error.message}, Error is ${error.code}}`);
            responseBody.message = `OTP request failed. Error code ${error.code}`;
            response.status(503).send(responseBody);
        });
});

module.exports = router;
