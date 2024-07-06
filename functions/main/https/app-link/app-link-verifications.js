const express = require("express");
const router = express.Router();

router.get("/", async (request, response) => {
    const body = {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "app.efficientbytes.booleanbear",
            "sha256_cert_fingerprints":
                ["88:7E:41:65:98:8E:A8:18:A9:31:1F:82:11:15:4E:E2:06:EC:75:18:65:9F:1B:E6:C2:74:54:2F:EB:13:D9:85"]
        }
    }
    const list = [];
    list.push(body);
    response.status(200).send(list);
});

module.exports = router;
