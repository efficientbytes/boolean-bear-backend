const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    logger.log(`http||app-link.`);

    const body = {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "app.efficientbytes.booleanbear",
            "sha256_cert_fingerprints":
                ["98:37:B8:3E:49:FA:1E:5B:F9:D8:50:A7:61:DD:49:49:AD:6E:E0:4B:3B:88:AD:A8:32:A7:E1:D8:A0:26:E2:69"]
        }
    }

    const list = [];
    list.push(body);

    response.status(200).send(list);

});

module.exports = router;
