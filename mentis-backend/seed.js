import mongoose from "mongoose";
import { Student } from "./src/models/student.models.js";
import { Teacher } from "./src/models/teacher.models.js";
import { User } from "./src/models/user.models.js";
import { Timetable } from "./src/models/timetable.models.js";
import dotenv from "dotenv";

dotenv.config();

// ✅ Use modern mongoose connect (no options needed in v6+)
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

const students = [

  {
    name: "Aarav Sharma",
    batchNo: 1,
    rollNo: "S24CSEU0001",
    email: "s24cseu0001@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Rajesh Sharma",
      motherName: "Mrs. Neha Sharma",
      dateOfBirth: "2004-03-14",
      gender: "Male",
      phoneNo: "+91 98765 43211",
      address: "21 Green Park, Delhi, India"
    }
  },
  {
    name: "Riya Verma",
    batchNo: 2,
    rollNo: "S24CSEU0002",
    email: "s24cseu0002@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Anil Verma",
      motherName: "Mrs. Shalini Verma",
      dateOfBirth: "2004-07-02",
      gender: "Female",
      phoneNo: "+91 91234 56781",
      address: "78 Charbagh, Lucknow, India"
    }
  },
  {
    name: "Karan Nair",
    batchNo: 3,
    rollNo: "S24CSEU0003",
    email: "s24cseu0003@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Sanjay Nair",
      motherName: "Mrs. Latha Nair",
      dateOfBirth: "2004-09-23",
      gender: "Male",
      phoneNo: "+91 99887 65431",
      address: "55 Marine Drive, Kochi, India"
    }
  },
  {
    name: "Sneha Gupta",
    batchNo: 4,
    rollNo: "S24CSEU0004",
    email: "s24cseu0004@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Manoj Gupta",
      motherName: "Mrs. Rekha Gupta",
      dateOfBirth: "2004-11-07",
      gender: "Female",
      phoneNo: "+91 87654 32108",
      address: "89 Civil Lines, Jaipur, India"
    }
  },
  {
    name: "Aditya Yadav",
    batchNo: 5,
    rollNo: "S24CSEU0005",
    email: "s24cseu0005@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Ramesh Yadav",
      motherName: "Mrs. Sunita Yadav",
      dateOfBirth: "2004-02-11",
      gender: "Male",
      phoneNo: "+91 93456 78121",
      address: "15 Ashok Nagar, Bhopal, India"
    }
  },
  {
    name: "Priya Mehta",
    batchNo: 6,
    rollNo: "S24CSEU0006",
    email: "s24cseu0006@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Rajiv Mehta",
      motherName: "Mrs. Kavita Mehta",
      dateOfBirth: "2004-04-04",
      gender: "Female",
      phoneNo: "+91 91230 45671",
      address: "101 Connaught Place, Delhi, India"
    }
  },
  {
    name: "Arjun Singh",
    batchNo: 7,
    rollNo: "S24CSEU0007",
    email: "s24cseu0007@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Vivek Singh",
      motherName: "Mrs. Alka Singh",
      dateOfBirth: "2004-05-26",
      gender: "Male",
      phoneNo: "+91 95432 18766",
      address: "77 Residency Road, Bangalore, India"
    }
  },
  {
    name: "Ananya Das",
    batchNo: 8,
    rollNo: "S24CSEU0008",
    email: "s24cseu0008@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Ajay Das",
      motherName: "Mrs. Seema Das",
      dateOfBirth: "2004-12-09",
      gender: "Female",
      phoneNo: "+91 99876 54322",
      address: "90 Salt Lake, Kolkata, India"
    }
  },
  {
    name: "Rohit Chandra",
    batchNo: 9,
    rollNo: "S24CSEU0009",
    email: "s24cseu0009@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Harish Chandra",
      motherName: "Mrs. Meera Chandra",
      dateOfBirth: "2004-06-20",
      gender: "Male",
      phoneNo: "+91 92345 67813",
      address: "12 Lalbagh, Kanpur, India"
    }
  },
  {
    name: "Nidhi Patel",
    batchNo: 10,
    rollNo: "S24CSEU0010",
    email: "s24cseu0010@silveroak.edu.in",
    degree: "Bachelor of Technology",
    course: "Computer Science & Engineering",
    semester: 3,
    academicSession: "2024-2028",
    personalInfo: {
      fatherName: "Mr. Nitin Patel",
      motherName: "Mrs. Rina Patel",
      dateOfBirth: "2004-08-30",
      gender: "Female",
      phoneNo: "+91 98712 34561",
      address: "34 SG Highway, Ahmedabad, India"
    }
  }

];

const teachers = [
  {
    "name": "Ananya",
    "empId": "T001",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "email": "ananya@college.edu",
    "dateOfBirth": "1990-01-01",
    "joiningYear": "2020-01-01",
    "personalInfo": {
      "gender": "Female",
      "phoneNo": "+91 98576 42516",
      "address": "01,new Street,yamuna nagar, Delhi"
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "batchNo": 1
      }
    ]
  },
  {
    "name": "Arjun",
    "empId": "T002",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "email": "arjun@college.edu",
    "dateOfBirth": "1980-05-11",
    "joiningYear": "2020-01-01",
    "personalInfo": {
      "gender": "Male",
      "phoneNo": "+91 97584 62459",
      "address": "01,sastri nagar, gaziabad"
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "Life Skill",
        "subjectCode": "LSK 901",
        "batchNo": 1
      }
    ]
  },
  {
    "name": "Kavita",
    "empId": "T003",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "email": "kavita@college.edu",
    "dateOfBirth": "1980-09-22",
    "joiningYear": "2025-11-01",
    "personalInfo": {
      "gender": "Female",
      "phoneNo": "+91 85971 62548",
      "address": "08,Gr. Kailash, Delhi"
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "Ethics",
        "subjectCode": "ETH 901",
        "batchNo": 1
      }
    ]
  },
  {
    "name": "Meera",
    "empId": "T004",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "email": "meera@college.edu",
    "dateOfBirth": "1976-08-01",
    "joiningYear": "2010-21-01",
    "personalInfo": {
      "gender": "Female",
      "phoneNo": "+91 75968 15485",
      "address": "01,New Market, Delhi"
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "Python",
        "subjectCode": "PYT 901",
        "batchNo": 1
      }
    ]
  },
  {
    "name": "Rajesh",
    "empId": "T005",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "dateOfBirth": "1996-09-12",
    "joiningYear": "2022-01-01",
    "email": "rajesh@college.edu",
    "personalInfo": {
      "gender": "Male",
      "phoneNo": "+91 76654 85976",
      "address": "122,Shahdara, Delhi"
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "batchNo": 1
      }
    ]
  },
  {
    "name": "Vikram",
    "empId": "T006",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "email": "vikram@college.edu",
    "dateOfBirth": "1972-12-01",
    "joiningYear": "2022-01-01",
    "personalInfo": {
      "gender": "Male",
      "phoneNo": "+91 95847 24156",
      "address": "01,Sector 12, Gurgaon",
    },
    "courses": [
      {
        "code": "CSE101",
        "name": "Computer Science and Engineering"
      }
    ],
    "batchAssigned": [
      {
        "batchNo": 1,
        "section": "A"
      }
    ],
    "subjectTeaching": [
      {
        "subject": "OS",
        "subjectCode": "OSY 901",
        "batchNo": 1
      }
    ]
  }
];

const timetables = [
  {
    "batchNo": 1,
    "entries": [
      {
        "day": "Monday",
        "startTime": "08:30",
        "endTime": "09:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "09:20",
        "endTime": "10:10",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "10:10",
        "endTime": "11:00",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "11:00",
        "endTime": "11:50",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "11:50",
        "endTime": "12:30",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "12:30",
        "endTime": "01:30 (Lunch)",
        "subject": "Lunch Break",
        "subjectCode": "LUNCH",
        "empId": null,
        "room": null
      },
      {
        "day": "Monday",
        "startTime": "01:30",
        "endTime": "02:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "02:20",
        "endTime": "03:10",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "03:10",
        "endTime": "04:00",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Monday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "08:30",
        "endTime": "09:20",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "10:10",
        "endTime": "11:00",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "11:00",
        "endTime": "11:50",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "11:50",
        "endTime": "12:30",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "12:30",
        "endTime": "01:30 (Lunch)",
        "subject": "Lunch Break",
        "subjectCode": "LUNCH",
        "empId": null,
        "room": null
      },
      {
        "day": "Tuesday",
        "startTime": "02:20",
        "endTime": "03:10",
        "subject": "Life Skill",
        "subjectCode": "LSK 901",
        "empId": "T002",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "03:10",
        "endTime": "04:00",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Tuesday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "09:20",
        "endTime": "10:10",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "10:10",
        "endTime": "11:00",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "11:00",
        "endTime": "11:50",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "11:50",
        "endTime": "12:30",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "12:30",
        "endTime": "01:30 (Lunch)",
        "subject": "Lunch Break",
        "subjectCode": "LUNCH",
        "empId": null,
        "room": null
      },
      {
        "day": "Wednesday",
        "startTime": "01:30",
        "endTime": "02:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "02:20",
        "endTime": "03:10",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "03:10",
        "endTime": "04:00",
        "subject": "Ethics",
        "subjectCode": "ETH 901",
        "empId": "T003",
        "room": "PLH101"
      },
      {
        "day": "Wednesday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "08:30",
        "endTime": "09:20",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "09:20",
        "endTime": "10:10",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "10:10",
        "endTime": "11:00",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "11:00",
        "endTime": "11:50",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "11:50",
        "endTime": "12:30",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "12:30",
        "endTime": "01:30 (Lunch)",
        "subject": "Lunch Break",
        "subjectCode": "LUNCH",
        "empId": null,
        "room": null
      },
      {
        "day": "Thursday",
        "startTime": "01:30",
        "endTime": "02:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "02:20",
        "endTime": "03:10",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "03:10",
        "endTime": "04:00",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Thursday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "08:30",
        "endTime": "09:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "10:10",
        "endTime": "11:00",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "11:00",
        "endTime": "11:50",
        "subject": "DBMS",
        "subjectCode": "DBM 901",
        "empId": "T001",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "11:50",
        "endTime": "12:30",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "12:30",
        "endTime": "01:30 (Lunch)",
        "subject": "Lunch Break",
        "subjectCode": "LUNCH",
        "empId": null,
        "room": null
      },
      {
        "day": "Friday",
        "startTime": "01:30",
        "endTime": "02:20",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "02:20",
        "endTime": "03:10",
        "subject": "Python",
        "subjectCode": "PYT 901",
        "empId": "T004",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "03:10",
        "endTime": "04:00",
        "subject": "DSA",
        "subjectCode": "DSA 901",
        "empId": "T005",
        "room": "PLH101"
      },
      {
        "day": "Friday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      },
      {
        "day": "Sunday",
        "startTime": "04:00",
        "endTime": "04:50",
        "subject": "OS",
        "subjectCode": "OSY 901",
        "empId": "T006",
        "room": "PLH101"
      }
    ]
  }
];

async function seedDB() {
  try {
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Timetable.deleteMany();
    console.log("🗑️ Old students,timetable & teachers deleted");

    await Student.insertMany(students);
    await Teacher.insertMany(teachers);
    await Timetable.insertMany(timetables);

    console.log("✅ New students & teachers inserted");

    // const studentUsers = students.map(student => ({
    //   name: student.name,
    //   email: student.email.toLowerCase(),
    //   password: "testpassword",
    //   role: "student"
    // }));

    // const teacherUsers = teachers.map(teacher => ({
    //   name: teacher.name,
    //   email: teacher.email.toLowerCase(),
    //   password: "testpassword",
    //   role: "teacher"
    // }));

    // await User.deleteMany();
    // console.log("🗑️ Old users deleted");

    // await User.insertMany([...studentUsers, ...teacherUsers]);
    // console.log("✅ New users inserted");

    console.log("✅ Database seeding completed!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    mongoose.connection.close();
  }
}

seedDB();
