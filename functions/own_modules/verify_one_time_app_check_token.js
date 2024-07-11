const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const verifyOneTimeAppCheckToken = async (req, res, next) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
        logger.info(`App check unauthorized access. No token provided.`);
        return res.status(414).send("Unauthorized Device");
    }

    try {
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken, {consume: true});

        if (appCheckClaims === undefined) {
            logger.info(`App check unauthorized access. Requires unconsumed token.`);
            return res.status(416).send("Unauthorized Device");
        }

        if (appCheckClaims.alreadyConsumed) {
            logger.info(`App check unauthorized access. Token already consumed.`);
            return res.status(417).send("Unauthorized Device");
        }

        return next();
    } catch (err) {
        logger.info(`App check unauthorized access. Error is ${err.toString()}`);
        return res.status(414).send("Unauthorized Device");
    }
}

module.exports = {
    verifyOneTimeAppCheckToken,
};