const express = require("express");
const router = express.Router();
const logger = require("firebase-functions/logger");
require("dotenv").config();
const twilioServiceSid = process.env.TWILIO_SERVICE_SID;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);
router.post("/", async (request, response) => {
  logger.log(`http||verify-phone-number-otp`);

  const phoneNumber = request.body.phoneNumber || null;
  logger.log(`param||phone number is : ${phoneNumber}`);
  const otp = request.body.otp || null;
  logger.log(`param||OTP is : ${otp}`);

  if (phoneNumber == null) {
    logger.error(`log||phone number is not provided`);

    response.status(400).send({
      message: `Phone number is not provided`,
      phoneNumber: phoneNumber,
    });
    return;
  }

  if (otp == null) {
    logger.error(`log||OTP is not provided`);

    response.status(400).send({
      message: `OTP is not provided`,
      phoneNumber: phoneNumber,
    });
    return;
  }
  ``;
  twilio.verify.v2
    .services(twilioServiceSid)
    .verificationChecks.create({ to: `+91${phoneNumber}`, code: otp })
    .then((verification_check) => {
      if (verification_check.status === "approved") {
        logger.log(
          `log||user phone number : ${phoneNumber}, verification successful`,
        );

        response.status(200).send({
          message: `Verification successful`,
          phoneNumber: phoneNumber,
        });
      } else if (verification_check.status === "pending") {
        logger.error(
          `log||user phone number : ${phoneNumber}, verification failed`,
        );

        response.status(401).send({
          message: `Verification failed`,
          phoneNumber: phoneNumber,
        });
      }
    })
    .catch((error) => {
      logger.error(
        `log||user phone number : ${phoneNumber}, verification failed. catch block error is ${error.message}`,
      );

      response.status(503).send({
        message: `Verification error identifier ${error.code}`,
        phoneNumber: phoneNumber,
      });
    });
});

module.exports = router;
