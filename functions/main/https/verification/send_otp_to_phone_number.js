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

    if (phoneNumber == null) {
        response.status(400).send({
            message: `Phone number is not provided`,
            phoneNumber: phoneNumber,
        });
        return;
    }

    const anubhav = new User("Anubhav", "9150472796", process.env.ANUBHAV);
    const dad = new User("Dad", "8056027454", process.env.DAD);
    const mom = new User("Mom", "9600165087", process.env.MOM);

    const testUserList = [anubhav, dad, mom];

    for (let user of testUserList) {
        if (user.phoneNumber === phoneNumber) {
            response.status(200).send({
                message: `OTP has been sent +91${phoneNumber}`,
                phoneNumber: phoneNumber,
            });
            return;
        }
    }

    twilio.verify.v2
        .services(twilioServiceSid)
        .verifications.create({to: `+91${phoneNumber}`, channel: "sms"})
        .then((verification) => {

            if (verification.status === "pending") {
                response.status(200).send({
                    message: `OTP has been sent +91${phoneNumber}`,
                    phoneNumber: phoneNumber,
                });
            }
        })
        .catch((error) => {
            logger.error(`send-otp-to-phone-number||failed||http||error is ${error.message}`);
            response.status(503).send({
                message: `Verification error identifier ${error.code}`,
                phoneNumber: phoneNumber,
            });
        });
});

module.exports = router;
