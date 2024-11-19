const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = require("../schemas/userModel");
const courseSchema = require("../schemas/courseModel");
const enrolledCourseSchema = require("../schemas/enrolledCourseModel");

// For registering
const registerController = async (req, res) => {
  try {
    const existsUser = await userSchema.findOne({ email: req.body.email });
    if (existsUser) {
      return res.status(200).send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    const newUser = new userSchema(req.body);
    await newUser.save();

    return res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).send({ success: false, message: error.message });
  }
};

// For login
const loginController = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).send({ message: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(200).send({ message: "Invalid email or password", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "1d" });
    user.password = undefined; // Remove password before sending user data

    return res.status(200).send({
      message: "Login success",
      success: true,
      token,
      userData: user,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).send({ success: false, message: error.message });
  }
};


const postCourseController = async (req, res) => {
  try {
    console.log("Received request data:", req.body);  // Add logs to see the data
    const { userId, C_educator, C_title, C_categories, C_price, C_description, S_title, S_description } = req.body;
    const S_content = req.files.map((file) => file.filename); // Assuming you want to store filenames
    console.log("Section content files:", S_content);
    
    const sections = S_title.map((title, index) => ({
      S_title: title,
      S_content: { filename: S_content[index], path: `/uploads/${S_content[index]}` },
      S_description: S_description[index],
    }));

    const price = C_price === 0 ? "free" : C_price;

    const course = new courseSchema({ userId, C_educator, C_title, C_categories, C_price: price, C_description, sections });
    await course.save();

    return res.status(201).send({ success: true, message: "Course created successfully" });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).send({ success: false, message: "Failed to create course" });
  }
};


// Get all courses
const getAllCoursesController = async (req, res) => {
  try {
    const allCourses = await courseSchema.find();
    if (!allCourses.length) {
      return res.status(404).send({ success: false, message: "No courses found" });
    }
    return res.status(200).send({ success: true, data: allCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).send({ success: false, message: "Failed to fetch courses" });
  }
};

// Get all courses for a specific user (teacher)
const getAllCoursesUserController = async (req, res) => {
  try {
    const allCourses = await courseSchema.find({ userId: req.body.userId });
    if (!allCourses.length) {
      return res.status(404).send({ success: false, message: "No courses found" });
    }
    return res.status(200).send({ success: true, data: allCourses });
  } catch (error) {
    console.error("Error fetching courses for user:", error);
    return res.status(500).send({ success: false, message: "Failed to fetch user courses" });
  }
};

// Enroll a student in a course
const enrolledCourseController = async (req, res) => {
  const { courseid } = req.params;
  const { userId } = req.body;

  try {
    const course = await courseSchema.findById(courseid);
    if (!course) {
      return res.status(404).send({ success: false, message: "Course not found" });
    }

    const enrolledCourse = await enrolledCourseSchema.findOne({ courseId: courseid, userId });
    if (enrolledCourse) {
      return res.status(400).send({ success: false, message: "Already enrolled in this course" });
    }

    const newEnrollment = new enrolledCourseSchema({ courseId: courseid, userId });
    await newEnrollment.save();

    course.enrolled += 1;
    await course.save();

    return res.status(200).send({ success: true, message: "Successfully enrolled", course });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return res.status(500).send({ success: false, message: "Failed to enroll" });
  }
};

// Delete a course
const deleteCourseController = async (req, res) => {
  try {
    const course = await courseSchema.findByIdAndDelete(req.params.courseid);
    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }
    return res.status(200).send({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error deleting course" });
  }
};

// Get course content
const sendCourseContentController = async (req, res) => {
  const { courseid } = req.params;
  
  try {
    const course = await courseSchema.findById(courseid);
    if (!course) {
      return res.status(404).send({ success: false, message: "Course not found" });
    }
    return res.status(200).send({ success: true, content: course.sections });
  } catch (error) {
    console.error("Error fetching course content:", error);
    return res.status(500).send({ success: false, message: "Failed to fetch course content" });
  }
};

// Complete a section
const completeSectionController = async (req, res) => {
  const { sectionId, courseId, userId } = req.body;

  try {
    const course = await courseSchema.findById(courseId);
    if (!course) {
      return res.status(404).send({ success: false, message: "Course not found" });
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).send({ success: false, message: "Section not found" });
    }
    
    if (!section.completedBy) {
      section.completedBy = [];
    }
    
    if (section.completedBy.includes(userId)) {
      return res.status(400).send({ success: false, message: "Section already completed by this user" });
    }

    section.completedBy.push(userId);
    await course.save();

    return res.status(200).send({ success: true, message: "Section completed" });
  } catch (error) {
    console.error("Error completing section:", error);
    return res.status(500).send({ success: false, message: "Failed to complete section" });
  }
};

// Get all courses of a user
const sendAllCoursesUserController = async (req, res) => {
  const { userId } = req.body;

  try {
    const userCourses = await enrolledCourseSchema.find({ userId }).populate('courseId');
    if (!userCourses.length) {
      return res.status(404).send({ success: false, message: "No courses found for user" });
    }
    return res.status(200).send({ success: true, data: userCourses });
  } catch (error) {
    console.error("Error fetching user's courses:", error);
    return res.status(500).send({ success: false, message: "Failed to fetch user's courses" });
  }
};

module.exports = {
  registerController,
  loginController,
  postCourseController,
  getAllCoursesController,
  getAllCoursesUserController,
  enrolledCourseController,
  deleteCourseController,
  sendCourseContentController,
  completeSectionController,
  sendAllCoursesUserController,
};
