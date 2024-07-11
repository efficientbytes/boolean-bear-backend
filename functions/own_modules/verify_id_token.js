const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

const verifyIdToken = async (req, res, next) => {

    const authorization = req.header("authorization");

    if (!authorization) {
        logger.info(`Id token unauthorized access. No token provided.`);
        return res.status(401).send(`Authentication Required`);
    }

    if (!authorization.startsWith("Bearer ")) {
        logger.info(`Id token unauthorized access. No token provided.`);
        return res.status(401).send(`Authentication Required`);
    }

    try {
        const idToken = authorization.split(' ')[1];
        const tokenData = await admin.auth().verifyIdToken(idToken);

        if (tokenData == null) {
            logger.info(`Id token unauthorized access. Authentication failed.`);
            return res.status(401).send("Authentication Failed");
        }

        const userAccountId = tokenData.uid;

        if (userAccountId == null) {
            logger.info(`Id token unauthorized access. User account could not be found.`);
            return res.status(401).send("Authentication Failed");
        }

        //continue to next , pass the userAccountId
        req.userAccountId = userAccountId;
        next();
    } catch (error) {
        logger.info(`Id token unauthorized access. Error is ${error.toString()}.`);
        return res.status(401).send("Authentication Failed");
    }

}

module.exports = {
    verifyIdToken,
};