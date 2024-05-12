const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();

class Courses {
    constructor(title, caption, description, requirements = [], displayIndex = 1, language = "EN", certification = true, previewVideoId = null, type1Thumbnail = null, type2Thumbnail = null, courseId = null, isPaid = true, validity = 12, minimumCompletion = 50, hashTags = ["coding"], instructorId = "ab0421c2-c01b-4bf4-8fd9-18ea84e0bf58", timeInHours = 14, timeInDays = 7, isRefundable = true, refundDayLimit = 15, isAvailable = false, nonAvailabilityReason = null, createdOn = null, updatedOn = null) {
        this.courseId = courseId;
        this.title = title;
        this.caption = caption;
        this.description = description;
        this.requirements = requirements;
        this.displayIndex = displayIndex;
        this.language = language;
        this.certification = certification;
        this.previewVideoId = previewVideoId;
        this.type1Thumbnail = type1Thumbnail;
        this.type2Thumbnail = type2Thumbnail;
        this.hashTags = hashTags;
        this.instructorId = instructorId;
        this.timeInHours = timeInHours;
        this.timeInDays = timeInDays;
        this.isPaid = isPaid;
        this.validity = validity;
        this.minimumCompletion = minimumCompletion;
        this.isRefundable = isRefundable;
        this.refundDayLimit = refundDayLimit;
        this.isAvailable = isAvailable;
        this.nonAvailabilityReason = nonAvailabilityReason;
        this.createdOn = createdOn;
        this.updatedOn = updatedOn;
    }
}

router.post("/", async (request, response) => {


    const topicId = request.body.topicId || null;

    const responseBody = {
        message: null,
    };

    if (topicId == null) {
        responseBody.message = "Topic id is not provided"
        response.status(400).send(responseBody);
        return;
    }

    const kotlinCourses = [
        new Courses("Kotlin for beginners", "Unlock Kotlin's Power: From Beginner to Pro! Dive into Kotlin for beginners and harness its potential through practical examples and engaging exercises", "Whether you're a seasoned developer or just starting out, this playlist is your gateway to mastering Kotlin. Explore the fundamentals of Kotlin programming through easy-to-follow tutorials, hands-on examples, and practical exercises."),
        new Courses("Object Oriented Programming in Kotlin", "Master Object-Oriented Programming in Kotlin. Build a robust foundation in OOP principles with Kotlin's concise syntax and dynamic features.", "Build a solid foundation in object-oriented programming (OOP) with Kotlin. This playlist covers essential OOP concepts, including classes, objects, inheritance, and polymorphism, in the context of Kotlin programming. Whether you're new to programming or transitioning from another language, master the fundamentals of OOP with Kotlin's concise syntax and intuitive language constructs."),
        new Courses("Kotlin Advanced", "Take Kotlin Beyond Basics! Elevate your skills with advanced concepts like coroutines, DSLs, and metaprogramming. Become a Kotlin expert!", "Elevate your Kotlin skills to the next level with this advanced playlist. Explore Kotlin's powerful features and language constructs that go beyond the basics. From coroutines and DSLs to metaprogramming and reflection, this playlist delves into advanced topics to help you become a proficient Kotlin developer."),
    ];

    const javaCourses = [
        new Courses("Java for beginners", "Embark on Your Java Journey! From novice to Java enthusiast, dive into the world of coding with Java for beginners. Start your programming adventure today!", "Discover the power of Java programming with this introductory playlist designed for beginners. Whether you're new to coding or looking to expand your skills, this playlist provides a gentle yet comprehensive introduction to Java, covering everything you need to know to get started."),
        new Courses("Object Oriented Programming in Java", "Master Object-Oriented Programming in Java. Join us as we unravel the mysteries of OOP, from classes to inheritance, in Java. Empower yourself to craft elegant software solutions with confidence.", "Build a solid foundation in object-oriented programming (OOP) with Java. This playlist covers the fundamental principles and concepts of OOP, including classes, objects, inheritance, polymorphism, and encapsulation. Whether you're new to programming or transitioning from another language, join us as we demystify OOP in Java and empower you to design elegant and maintainable software solutions."),
        new Courses("Concurrency in Java", "Unlock Java's Concurrency Power! Take your Java skills to new heights with a deep dive into concurrency essentials. Explore thread management, safety, and communication to build robust concurrent systems.", "Ready to take your Java programming skills to the next level? This playlist offers a deep dive into concurrency essentials in Java, providing a solid foundation for designing and implementing concurrent systems. Explore key concepts such as thread management, thread safety, and inter-thread communication as you learn to leverage Java's concurrency APIs effectively."),
    ];

    const cPlusPlusCourses = [
        new Courses("C++ for beginners", "Begin Your C++ Adventure! Dive into the world of C++ programming with this beginner-friendly playlist. Learn essential concepts and unleash your coding potential!", "Welcome to the exciting world of C++ programming! Designed for beginners, this playlist provides a gentle introduction to C++ programming, covering essential concepts, syntax, and best practices. Get ready to unleash your coding potential and embark on a journey of discovery with C++."),
        new Courses("Object Oriented Programming in C++", "Master Object-Oriented Programming in C++. Elevate your C++ skills with a deep dive into OOP principles. From class design to polymorphism, build robust software systems with confidence.", "Ready to take your C++ skills to the next level? This playlist offers a deep dive into object-oriented programming (OOP) concepts in C++, providing a solid foundation for building complex and maintainable software systems. From designing classes to implementing inheritance and polymorphism, join us as we explore the principles and practices of OOP in C++."),
    ];

    const figmaCourses = [
        new Courses("Figma for beginners", "Design Beyond Boundaries with Figma! Dive into the world of prototyping with Figma for beginners. Learn to craft interactive experiences, define user flows, and unleash your creativity with Figma's powerful features.", "Ready to bring your designs to life? This playlist is your guide to prototyping with Figma, the industry-leading design tool for interactive prototypes. Learn how to create clickable prototypes, define interactions, and simulate user flows with Figma's powerful prototyping features. Whether you're designing web apps, mobile interfaces, or digital experiences, join us as we explore the art of prototyping with Figma."),
    ];

    const androidXMLCourses = [
        new Courses("Android for beginners", "Empower Your App Dreams with Android! Dive into app development with this beginner-friendly playlist. Learn to build your first Android app, from UI design to functionality integration, and unleash your creativity in the world of mobile apps.", "Unlock the power of Android app development with this hands-on playlist. Follow along as we walk you through the process of building your first Android app from scratch. Learn how to create user interfaces, handle user interactions, and integrate functionality using Java or Kotlin, empowering you to bring your app ideas to life."),
    ];

    const androidComposeCourses = [
        new Courses("Android Compose for beginners", "Enter the Future of Android UIs with Compose! Discover the power of Jetpack Compose in this beginner-friendly playlist. From basics to brilliance, learn to craft dynamic and responsive UIs for Android apps using Compose's intuitive APIs. Let's dive in and unlock your creativity in UI design!", "Build a strong foundation in Jetpack Compose basics with this beginner-friendly playlist. Whether you're new to Android development or experienced with traditional UI frameworks, learn how to use Compose's intuitive APIs to create dynamic and responsive UIs for Android apps. Join us as we explore the fundamental tools and techniques of Compose and help you unleash your creativity in UI design."),
    ];

    const gitCourses = [
        new Courses("Git for beginners", "Master Collaboration with Git! Unlock the power of Git for beginners and revolutionize your team's workflow. Explore remote repositories, pull requests, and more to streamline collaboration and elevate your development process. Let Git be your guide to seamless teamwork!", "Empower your team to collaborate more effectively with Git. This playlist covers the collaborative features of Git, including remote repositories, pull requests, code reviews, and more. Whether you're working with a distributed team or contributing to open-source projects, learn how Git can streamline your development workflow and foster better collaboration across your team."),
    ];

    const coursePath = `/ASSETS/CURATED/COURSES/`;
    const courseRef = admin.firestore().collection(coursePath);
    const time = admin.firestore.FieldValue.serverTimestamp();

    try {
        let courses
        if (topicId === "e5bj4bjr96ilxca0sQ6N") {
            courses = kotlinCourses;
        } else if (topicId === "6Ja7m8G9zD8nIisVUYgg") {
            courses = javaCourses;
        } else if (topicId === "YVFA7dOxByU2Qc8QdmxL") {
            courses = cPlusPlusCourses;
        } else if (topicId === "MlCN4BReIuA3Epfzam7Z") {
            courses = figmaCourses;
        } else if (topicId === "QTTuWP5HNeDJqjLy2PEz") {
            courses = androidXMLCourses;
        } else if (topicId === "xzNs9bt8KaQPxiNKsvHc") {
            courses = androidComposeCourses;
        } else if (topicId === "gWCmh4pajQdLB7XkGEgA") {
            courses = gitCourses;
        } else {
            courses = null;
        }

        if (courses == null) {
            responseBody.message = "Course list could not be allocated";
            response.status(500).send(responseBody);
            return;
        }
        for (const course of courses) {
            course.courseId = courseRef.doc().id;
            await courseRef.doc(course.courseId).set({
                courseId: course.courseId,
                title: course.title,
                caption: course.caption,
                description: course.description,
                requirements: course.requirements,
                displayIndex: course.displayIndex,
                language: course.language,
                certification: course.certification,
                previewVideoId: course.previewVideoId,
                type1Thumbnail: course.type1Thumbnail,
                type2Thumbnail: course.type2Thumbnail,
                hashTags: course.hashTags,
                instructorId: course.instructorId,
                timeInHours: course.timeInHours,
                timeInDays: course.timeInDays,
                isPaid: course.isPaid,
                validity: course.validity,
                minimumCompletion: course.minimumCompletion,
                isRefundable: course.isRefundable,
                refundDayLimit: course.refundDayLimit,
                isAvailable: course.isAvailable,
                nonAvailabilityReason: course.nonAvailabilityReason,
                createdOn: time,
                updatedOn: time
            });
        }
        responseBody.message = `Courses have been successfully uploaded.`;
        response.status(200).send(responseBody);
    } catch (error) {
        responseBody.message = `Could not upload the courses, Error is ${error.message}`;
        response.status(500).send(responseBody);
    }
});

module.exports = router;
