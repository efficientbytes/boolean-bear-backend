const admin = require("firebase-admin");
const express = require("express");
const {v4: uuidv4} = require("uuid");
const router = express.Router();

router.post("/", async (request, response) => {
    const instructorId = uuidv4();
    const firstName = request.body.firstName || null;
    const lastName = request.body.lastName || null;
    const phoneNumber = request.body.phoneNumber || null;
    const emailAddress = request.body.emailAddress || null;
    const skills = ["", ""];
    const oneLineDescription = request.body.oneLineDescription || null;
    const bio = request.body.bio || null;
    const gitHubUsername = request.body.gitHubUsername || null;
    const linkedInUsername = request.body.linkedInUsername || null;
    const coverImage = request.body.coverImage || null;
    const profileImage = request.body.profileImage || null;
    const profession = request.body.profession || "";
    const workingAt = request.body.workingAt || "";

    const responseBody = {
        message: null,
    };

    if (firstName == null) {
        responseBody.message = `first name cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (phoneNumber == null) {
        responseBody.message = `phone number cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    if (emailAddress == null) {
        responseBody.message = `email address cannot be null`;
        response.status(400).send(responseBody);
        return;
    }

    const time = admin.firestore.FieldValue.serverTimestamp();

    const joinedOn = time;
    const updatedOn = time;

    const instructorCollectionPath = `/INSTRUCTORS/PRIVATE-PROFILES/FILES/`;
    const instructorCollectionRef = admin.firestore().collection(instructorCollectionPath);

    await instructorCollectionRef.doc(instructorId).set({
        instructorId: instructorId,
        firstName: firstName,
        lastName: lastName,
        phoneNumberPrefix: "+91",
        completePhoneNumber: `+91${phoneNumber}`,
        phoneNumber: phoneNumber,
        emailAddress: emailAddress,
        skills: skills,
        oneLineDescription: oneLineDescription,
        bio: bio,
        gitHubUsername: gitHubUsername,
        linkedInUsername: linkedInUsername,
        coverImage: coverImage,
        profileImage: profileImage,
        profession: profession,
        workingAt: workingAt,
        joinedOn: joinedOn,
        updatedOn: updatedOn
    }).then(() => {
        responseBody.message = `Uploaded instructor profile with instructor id ${instructorId}`;
        response.status(200).send(responseBody);
    }).catch((error) => {
        responseBody.message = error.message;
        response.status(500).send(responseBody);
    });

});

module.exports = router;
