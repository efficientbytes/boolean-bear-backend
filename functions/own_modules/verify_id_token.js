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
            return res.status(401).send("Invalid Auth Token");
        }

        const userAccountId = tokenData.uid;

        if (userAccountId == null) {
            return res.status(401).send("Invalid Auth Token");
        }

        //continue to next , pass the userAccountId
        req.userAccountId = userAccountId;
        next();
    } catch (error) {
        return res.status(401).send("Invalid Auth Token");
    }

}

module.exports = {
    verifyIdToken,
};