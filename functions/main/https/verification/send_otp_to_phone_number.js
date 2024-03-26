const express = require("express");
const router = express.Router();
const logger = require("firebase-functions/logger");
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);

router.post("/", async (request, response) => {
  logger.log(`http||send-otp-to-phone-number`);

  const phoneNumber = request.body.phoneNumber || null;
  logger.log(`param||phone number : ${phoneNumber}`);

  if (phoneNumber == null) {
    logger.log(`error||phone number is null`);

    response.status(400).send({
      message: `Phone number is not provided`,
      phoneNumber: phoneNumber,
    });
    return;
  }

  twilio.verify.v2
    .services(twilioServiceSid)
    .verifications.create({ to: `+91${phoneNumber}`, channel: "sms" })
    .then((verification) => {
      logger.log(`log||OTP sent to phone number ${phoneNumber}`);

      if (verification.status === "pending") {
        response.status(200).send({
          message: `OTP has been sent +91${phoneNumber}`,
          phoneNumber: phoneNumber,
        });
      }
    })
    .catch((error) => {
      logger.log(
        `log||verification failed for phone number : ${phoneNumber}, error is: ${error.code}`,
      );

      response.status(503).send({
        message: `Verification error identifier ${error.code}`,
        phoneNumber: phoneNumber,
      });
    });
});

module.exports = router;
