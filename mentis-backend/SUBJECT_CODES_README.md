# Subject Codes Implementation

This document explains the subject codes feature that has been added to the timetable system.

## What's New

### Backend Changes

1. **Database Model Update** (`src/models/timetable.models.js`)
   - Added `subjectCode` field to timetable entries
   - Field is optional (not required) to maintain backward compatibility

2. **Controller Updates**
   - **Student Timetable Controller** (`src/controllers/studenttimetable.controller.js`)
     - Now includes `subjectCode` in API response
     - Falls back to `subject` name if `subjectCode` is not available
   
   - **Teacher Timetable Controller** (`src/controllers/teachertimetable.controllers.js`)
     - Now includes `subjectCode` in API response
     - Falls back to `subject` name if `subjectCode` is not available

3. **Sample Data** (`seed.js`)
   - Updated with example subject codes:
     - Python → PYT 901
     - DSA → DSA 901
     - DBMS → DBM 901
     - OS → OSY 901
     - Life Skill → LSK 901
     - Ethics → ETH 901
     - Lunch Break → LUNCH

### Frontend Changes

1. **Student Dashboard** (`mentis-fr-js/student-attendance/js/student.js`)
   - Timetable now displays subject codes alongside subject names
   - Format: "Code: [SUBJECT_CODE] | Faculty: [TEACHER_NAME]"

2. **Teacher Dashboard** (`mentis-fr-js/student-attendance/js/teacher.js`)
   - Timetable now displays subject codes alongside subject names
   - Format: "Code: [SUBJECT_CODE] | Classroom: [ROOM] | Time: [TIME]"

## How to Use

### For New Timetable Entries

When creating new timetable entries, you can now include a `subjectCode` field:

```javascript
{
  "day": "Monday",
  "startTime": "08:30",
  "endTime": "09:20",
  "subject": "Data Structures",
  "subjectCode": "DSA 902",  // New field
  "empId": "T001",
  "room": "PLH101"
}
```

### Updating Existing Data

If you have existing timetable data without subject codes, you can:

1. **Use the Migration Script** (Recommended):
   ```bash
   cd mentis911/mentis-backend
   node update-subject-codes.js
   ```

2. **Re-seed the Database**:
   ```bash
   cd mentis911/mentis-backend
   node seed.js
   ```

3. **Manual Update**: Update your existing timetable entries to include `subjectCode` fields.

## Subject Code Format

The recommended format for subject codes is:
- **Format**: `[SUBJECT_ABBREVIATION] [COURSE_NUMBER]`
- **Examples**:
  - Data Structures and Algorithms → DSA 901
  - Python Programming → PYT 901
  - Database Management Systems → DBM 901
  - Operating Systems → OSY 901

## Backward Compatibility

- The system is fully backward compatible
- If `subjectCode` is not provided, it will fall back to using the `subject` name
- Existing timetables without subject codes will continue to work normally

## API Response Format

### Student Timetable Response
```json
{
  "data": {
    "classes": [
      {
        "subject": "Data Structures",
        "subjectCode": "DSA 901",
        "teacherName": "Dr. Smith",
        "startTime": "08:30",
        "endTime": "09:20",
        "room": "PLH101"
      }
    ]
  }
}
```

### Teacher Timetable Response
```json
{
  "data": {
    "classes": [
      {
        "subject": "Data Structures",
        "subjectCode": "DSA 901",
        "startTime": "08:30",
        "endTime": "09:20",
        "room": "PLH101"
      }
    ]
  }
}
```

## Testing

To test the implementation:

1. Start your backend server
2. Login as a student or teacher
3. Navigate to the timetable section
4. Verify that subject codes are displayed alongside subject names

## Troubleshooting

- If subject codes are not showing, ensure your database has been updated with the new schema
- Run the migration script to add subject codes to existing data
- Check browser console for any JavaScript errors
- Verify that the backend API is returning the `subjectCode` field in responses
