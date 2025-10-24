# 7. External APIs

## Google Calendar API (Optional)
- **Purpose:** Import game and training schedules from existing Google Calendar
- **Authentication:** OAuth 2.0 with calendar.readonly scope
- **Integration Notes:** One-way sync only; protected completed games never overwritten

## iCalendar (.ics) File Import
- **Purpose:** Import schedules from any calendar system via standard .ics file format
- **Authentication:** None required - user uploads file
- **Integration Notes:** Client-side parsing with ical.js library; more privacy-friendly than OAuth

---
