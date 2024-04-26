const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    response.status(200).send({
        message: `You can delete your account only using our boolean bear app. Follow the below steps for this link to work. `,
        link: `https://app.booleanbear.com/account/delete/`,
        step1: `Install the boolean bear app from google play store.`,
        step2: `Login with your account.`,
        step3: `You can follow either of the below options (a or b) to help you navigate to account deletion feature in our app.`,
        option_a: `Revisit this link in the device you installed the app while you are logged in to your account you want to delete. You will be automatically navigated to the account deletion feature if app is installed.`,
        option_b: `Or alternatively you can open the app and visit account settings->get in touch with us->delete your account.`,
    });
});

module.exports = router;
