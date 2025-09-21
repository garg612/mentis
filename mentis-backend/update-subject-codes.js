import mongoose from "mongoose";
import { Timetable } from "./src/models/timetable.models.js";
import dotenv from "dotenv";

dotenv.config();

// Subject code mapping
const subjectCodeMap = {
    "Python": "PYT 901",
    "DSA": "DSA 901",
    "DBMS": "DBM 901",
    "OS": "OSY 901",
    "Life Skill": "LSK 901",
    "Ethics": "ETH 901",
    "Lunch Break": "LUNCH"
};

async function updateSubjectCodes() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Connected to database");

        // Get all timetables
        const timetables = await Timetable.find({});
        console.log(`📊 Found ${timetables.length} timetables`);

        let updatedCount = 0;

        for (const timetable of timetables) {
            let hasUpdates = false;

            for (const entry of timetable.entries) {
                if (entry.subject && !entry.subjectCode && subjectCodeMap[entry.subject]) {
                    entry.subjectCode = subjectCodeMap[entry.subject];
                    hasUpdates = true;
                }
            }

            if (hasUpdates) {
                await timetable.save();
                updatedCount++;
                console.log(`✅ Updated timetable for batch ${timetable.batchNo}`);
            }
        }

        console.log(`🎉 Successfully updated ${updatedCount} timetables with subject codes`);

    } catch (error) {
        console.error("❌ Error updating subject codes:", error);
    } finally {
        mongoose.connection.close();
        console.log("🔌 Database connection closed");
    }
}

// Run the update
updateSubjectCodes();
