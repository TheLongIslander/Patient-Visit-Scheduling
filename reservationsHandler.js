const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { isWeekend, formatDate, convertToICalendarFormat, convertFromICalendarFormat, isHoliday } = require('./utils');
const uuid = require('uuid');

const reservationsFilePath = path.join(__dirname, 'reservations.json');

const isDateReserved = (inputDate) => {
    const reservations = readReservations();
    const formattedInputDate = inputDate.replace(/-/g, '');

    return reservations.some(reservation =>
        reservation.DTSTART.startsWith(formattedInputDate) && reservation.STATUS !== "CANCELLED"
    );
};

const findNextAvailableDate = (startDate) => {
    let currentDate = new Date(startDate);
    let holidayDate = new Date(startDate);
    currentDate.setUTCHours(9, 0, 0, 0); // Set to 9:00 AM UTC
    do {
        currentDate.setDate(currentDate.getDate() + 1);
        holidayDate.setDate(holidayDate.getDate() + 1);
        currentDate = new Date(currentDate.toISOString().split('T')[0] + "T09:00:00Z");
    } while (isDateReserved(formatDate(currentDate)) || isWeekend(currentDate) || isHoliday(holidayDate));
    return formatDate(currentDate);
};



const readReservations = () => {
    if (!fs.existsSync(reservationsFilePath)) return [];
    return JSON.parse(fs.readFileSync(reservationsFilePath, 'utf8'));
};

const writeReservations = (reservations) => {
    fs.writeFileSync(reservationsFilePath, JSON.stringify(reservations, null, 2));
};

const findNextAvailableDates = (n, startDate) => {
    let availableDates = [];
    let currentDate = new Date(startDate);
    let holidayDate = new Date(startDate);
    currentDate.setUTCHours(9, 0, 0, 0); 
    const reservations = readReservations();

    while (availableDates.length < n) {
        if (!isWeekend(currentDate) && !isHoliday(currentDate) && !isDateReserved(formatDate(holidayDate))) {
            const formattedDate = convertToICalendarFormat(formatDate(currentDate));
            if (!reservations.some(r => r.DTSTART === formattedDate && r.STATUS !== "CANCELLED")) 
            {
                availableDates.push(convertFromICalendarFormat(formattedDate));
            }
        } 
        currentDate.setDate(currentDate.getDate() + 1); 
        holidayDate.setDate(holidayDate.getDate() + 1);
    }
    return availableDates;
};


const makeReservation = ({ DTSTART, ATTENDEE, METHOD, STATUS }) => {
    const reservations = readReservations();
    const iCalendarDTSTART = convertToICalendarFormat(DTSTART, "09:00:00"); // Convert to iCalendar format

    // Check if the date is already reserved
    if (isWeekend(new Date(DTSTART)) || isDateReserved(DTSTART) || isHoliday(DTSTART)) {
        console.log("The date falls on a weekend, is already reserved, or is a holiday.");
        return null; // Or handle this case as needed
    }

    // Generate a UUID for confirmation code
    const rawId = uuid.v4();
    const hash = crypto.createHash('sha256').update(rawId).digest('hex');
    const confirmationCode = hash.substring(0, 8); // Use the first 8 characters of the hash

    // Construct the reservation object with the iCalendar formatted DTSTART
    const reservation = {
        DTSTART: iCalendarDTSTART, // iCalendar format
        ATTENDEE: `mailto:${ATTENDEE}`,
        DTSTAMP: new Date().toISOString().replace(/[-:.]/g, '').slice(0, -1) + 'Z', // Current timestamp in iCalendar format
        METHOD,
        STATUS,
        confirmationCode
    };

    // Add the reservation to the existing list and write back to the file
    reservations.push(reservation);
    writeReservations(reservations);

    return confirmationCode;
};

const lookupReservations = (patientEmail) => {
    const emailToLookup = patientEmail.startsWith("mailto:") ? patientEmail : `mailto:${patientEmail}`;
    return readReservations().filter(r => r.ATTENDEE === emailToLookup);
};


const cancelReservation = (confirmationCode) => {
    return new Promise((resolve, reject) => {
        let reservations = readReservations();
        const reservationIndex = reservations.findIndex(reservation => reservation.confirmationCode === confirmationCode);
        if (reservationIndex !== -1) {
            reservations[reservationIndex].STATUS = "CANCELLED";
            writeReservations(reservations);
            resolve(true);
        } else {
            resolve(false);
        }
    });
};

module.exports = { findNextAvailableDates, makeReservation, lookupReservations, cancelReservation, isDateReserved, findNextAvailableDate, };
