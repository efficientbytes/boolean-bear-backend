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
    const otp = request.body.otp || null;

    const responseBody = {
        data: null,
        message: null,
    }

    responseBody.data = {
        prefix: null,
        phoneNumber: null
    }

    if (phoneNumber == null) {
        responseBody.message = `Phone number is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (prefix == null) {
        responseBody.message = `Prefix is not provided`;
        response.status(400).send(responseBody);
        return;
    }

    if (otp == null) {
        responseBody.message = `OTP is not provided`;
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

    twilio.verify.v2
        .services(twilioServiceSid)
        .verificationChecks.create({to: `${prefix}${phoneNumber}`, code: otp})
        .then((verification_check) => {
            if (verification_check.status === "approved") {
                responseBody.message = `Verification successful`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(200).send(responseBody);
            } else if (verification_check.status === "pending") {
                responseBody.message = `Verification failed`;
                responseBody.data.phoneNumber = phoneNumber;
                responseBody.data.prefix = prefix;
                response.status(400).send(responseBody);
            }
        })
        .catch((error) => {
            logger.error(`verify-phone-number-otp||failed||http||error is ${error.message}`);
            responseBody.message = `Verification error identifier ${error.code}`;
            responseBody.data.phoneNumber = phoneNumber;
            responseBody.data.prefix = prefix;
            response.status(503).send(responseBody);
        });
});

module.exports = router;
