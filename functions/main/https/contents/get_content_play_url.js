const admin = require("firebase-admin");
const express = require("express");
const {escape} = require("querystring");
const crypto = require("crypto");
const {logger} = require("firebase-functions");
const router = express.Router();
const securityKey = process.env.CONTENT_API_KEY;

function generateSignedUrl(
    videoId,
    minutes = 45,
) {

    /*
      url: CDN URL w/o the trailing '/' - exp. http://test.b-cdn.net/file.png
      securityKey: Security token found in your pull zone
      expirationTime: Authentication validity (default. 86400 sec/24 hrs)
      userIp: Optional parameter if you have the User IP feature enabled
      isDirectory: Optional parameter - "true" returns a URL separated by forward slashes (exp. (domain)/bcdn_token=...)
      pathAllowed: Directory to authenticate (exp. /path/to/images)
      countriesAllowed: List of countries allowed (exp. CA, US, TH)
      countriesBlocked: List of countries blocked (exp. CA, US, TH)
    */

    //concatenate videoID with the base url
    const baseUrl = "https://vz-5f0cfb49-882.b-cdn.net/";
    const unsignedUrl = baseUrl + videoId + `/playlist.m3u8`;

    let parameterData = '', parameterDataUrl = '', signaturePath = '', hashAbleBase = '', token = '';

    //set expiration time
    const expirationTime = Math.round(Date.now() / 1000) + (60 * minutes);

    //add countries to the block and allow list to generate new link
    const allowedCountriesList = ["IN"];
    const blockedCountriesList = null;

    let temporaryUrl = unsignedUrl;
    if (allowedCountriesList != null) {
        const allowedCountriesUrl = new URL(temporaryUrl);
        temporaryUrl += (allowedCountriesUrl.search === '' ? '?' : '&') + 'token_countries=' + allowedCountriesList;
    }
    if (blockedCountriesList != null) {
        const blockedCountriesUrl = new URL(temporaryUrl);
        temporaryUrl +=
            (blockedCountriesUrl.search === '' ? '?' : '&') + 'token_countries_blocked=' + blockedCountriesList;
    }
    const urlWithCountryBlocker = temporaryUrl;

    //pre encryption formatting
    const parsedUrl = new URL(urlWithCountryBlocker);
    const parameters = new URL(urlWithCountryBlocker).searchParams;

    const allowSubDirectoriesFor = `/${videoId}/`;
    if (allowSubDirectoriesFor !== '') {
        signaturePath = allowSubDirectoriesFor;
        parameters.set('token_path', signaturePath);
    } else {
        signaturePath = decodeURIComponent(parsedUrl.pathname);
    }
    parameters.sort();
    if (Array.from(parameters).length > 0) {
        parameters.forEach(function (value, key) {
            if (value === '') {
                return;
            }
            if (parameterData.length > 0) {
                parameterData += '&';
            }
            parameterData += key + '=' + value;
            parameterDataUrl += '&' + key + '=' + escape(value);
        });
    }

    //generate the token after encryption
    hashAbleBase = securityKey + signaturePath + expirationTime + '' + parameterData;
    token = Buffer.from(crypto.createHash('sha256').update(hashAbleBase).digest(),).toString('base64');
    token = token
        .replace(/\n/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    //generate the complete url
    return (
        parsedUrl.protocol +
        '//' +
        parsedUrl.host +
        '/bcdn_token=' +
        token +
        parameterDataUrl +
        '&expires=' +
        expirationTime +
        parsedUrl.pathname
    );
}


router.get("/:contentId/play-link", async (request, response) => {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        response.status(401).send({message: `Authentication required.`});
        return;
    }
    const idToken = request.headers.authorization.split(' ')[1];
    let userAccountId;
    try {
        const tokenData = await admin.auth().verifyIdToken(idToken);
        if (tokenData == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
        userAccountId = tokenData.uid;
        if (userAccountId == null) {
            response.status(401).send({message: `Invalid auth token`});
            return;
        }
    } catch (error) {
        response.status(401).send({message: `Invalid auth token`});
        return;
    }

    const contentId = request.params.contentId || null;

    const responseBody = {
        playUrl: null,
        message: null
    }

    if (contentId == null) {
        responseBody.message = `Content Id is not provided.`;
        response.status(400).send(responseBody);
        return;
    }

    const contentPath = `/ASSETS/CONTENTS/FILES/${contentId}`;
    const contentRef = admin.firestore().doc(contentPath);

    const contentQueryResult = await contentRef.get();

    if (!contentQueryResult.exists) {
        responseBody.message = `${contentId} content does not exists.`;
        response.status(404).send(responseBody);
        return;
    }

    const content = contentQueryResult.data();

    const videoId = content.videoId;

    try {
        const signedUrl = generateSignedUrl(videoId, 10);
        responseBody.playUrl = signedUrl;
        responseBody.message = `Successfully fetched play url`;
        response.status(200).send(responseBody);
    } catch (error) {
        logger.error(`get-content-play-url||failed||http||error is ${error.message}`);
        responseBody.playUrl = null;
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    }
});

module.exports = router;
