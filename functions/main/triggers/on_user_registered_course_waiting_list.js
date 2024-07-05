const admin = require("firebase-admin");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

exports.onUserJoinedCourseWaitingList = onDocumentCreated("/ASSETS/CURATED/COURSES/{courseId}/WAITING-LIST/{docId}",
    async (event) => {

        const courseId = event.params.courseId;

        const waitingListData = event.data.data();

        const userAccountId = waitingListData.userAccountId;

        const userPrivateProfilePath = `/USERS/PRIVATE-PROFILES/FILES/${userAccountId}`;
        const userPrivateProfileRef = admin.firestore().doc(userPrivateProfilePath);
        const userPrivateProfileQueryResult = await userPrivateProfileRef.get();

        if (!userPrivateProfileQueryResult.exists) {
            return;
        }

        await userPrivateProfileRef.update({
            "courseWaitingList": admin.firestore.FieldValue.arrayUnion(courseId),
        });

    },
);
