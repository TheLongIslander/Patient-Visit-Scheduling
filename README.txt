Doctor's Office Scheduler - README

Overview:

The Doctor's Office Scheduler is a command-line application developed in Node.js, designed for scheduling patient visits to a doctor's office. This application supports finding available dates, making reservations, looking up reservations by patient email, and canceling reservations using a confirmation code. It uses the iCalendar format to record appointments, ensuring compatibility and standardization in calendar event management.

Features:
- Find Available Dates: Lists the next N available dates for appointments, excluding weekends and US Federal holidays, within a specified range. N can be between 1 and 4.

- Make Reservations: Allows users to reserve a selected date by entering iCalendar event properties such as ATTENDEE, DTSTART, DTSTAMP, METHOD, and STATUS. A successful reservation returns a unique confirmation code.

- Lookup Reservations: Users can retrieve upcoming reservations by providing the patient's email address.

- Cancel Reservations: Reservations can be canceled using the provided confirmation code, freeing up the date for other patients.

Dependencies Required:
    - date-holidays: Used for determining public holidays to exclude them from available appointment dates.

        npm install date-holidays

    - node-ical uuid: Generates unique identifiers for reservation confirmation codes.
    
        npm install express node-ical uuid

    - uuid
            npm install uuid

Usage:

Start the Scheduler -
Once in your current working directory, add related project files to your directory (index.js, reservationsHandler.js, and utils.js), and run the command

    node index.js

to enter the application If there is already a "reservations.json" file located in your directory, the application will utilize that, provided it follows the proper formatting which is shown below:

[
  {
    "DTSTART": "20240226T090000Z",
    "ATTENDEE": "mailto:tomdurie24@gmail.com",
    "DTSTAMP": "20240219T232123048Z",
    "METHOD": "REQUEST",
    "STATUS": "CONFIRMED",
    "confirmationCode": "12269bf8"
  },
  {
    "DTSTART": "20240307T090000Z",
    "ATTENDEE": "mailto:alecdoody@gmail.com",
    "DTSTAMP": "20240219T232143381Z",
    "METHOD": "REQUEST",
    "STATUS": "CANCELLED",
    "confirmationCode": "43b616a0"
  },
  {
    "DTSTART": "20240229T090000Z",
    "ATTENDEE": "mailto:sobthebob@gmail.com",
    "DTSTAMP": "20240219T232219391Z",
    "METHOD": "REQUEST",
    "STATUS": "CONFIRMED",
    "confirmationCode": "6f8984de"
  }
]

if one does not have a reservations.json file, one will be create by the program once a valid reservation is made with the Doctor's Office.
