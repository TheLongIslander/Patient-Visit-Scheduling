const readline = require('readline');
const { isWeekend, formatDate, convertToICalendarFormat, convertFromICalendarFormat,convertTimestampForDisplay,isHoliday } = require('./utils');
const { findNextAvailableDates, makeReservation, lookupReservations, cancelReservation, isDateReserved, findNextAvailableDate } = require('./reservationsHandler');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => new Promise(resolve => rl.question(question, resolve));

const main = async () => {
    while (true) {
        console.log(`\n*** Doctor's Office Scheduler ***`);
        console.log('1. Find available dates');
        console.log('2. Make a reservation');
        console.log('3. Lookup reservations');
        console.log('4. Cancel a reservation');
        console.log('5. Exit');
        const choice = await askQuestion('Select an option: ');

        switch (choice.trim()) {
            case '1':
                let isValidInput = false;
                let n = 0;
                while (!isValidInput) {
                    n = await askQuestion('How many dates to find? (1-4): ');
                    // Check if n is a positive integer up to 4
                    if (/^\d+$/.test(n) && parseInt(n, 10) > 0 && parseInt(n, 10) <= 4) {
                        isValidInput = true;
                    } else {
                        console.log('Invalid input. Please enter a positive number up to 4.');
                    }
                }

                const startDate = await askQuestion('Enter start date (YYYY-MM-DD): ');
                console.log('Finding available dates...');
                const availableDates = findNextAvailableDates(parseInt(n, 10), new Date(startDate));
                if (availableDates.length > 0) {
                    console.log('Available Dates:');
                    availableDates.forEach(date => console.log(date));
                } else {
                    console.log('No available dates found.');
                }
                break;
            case '2':
                console.log('\n*** Make a Reservation ***');
                let DTSTART = await askQuestion('Enter the date for your appointment (YYYY-MM-DD): ');
                // Validate date format and check if it's in the past.
                while (!/^\d{4}-\d{2}-\d{2}$/.test(DTSTART) || new Date(DTSTART).toString() === 'Invalid Date' || new Date(DTSTART) < new Date()) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(DTSTART) || new Date(DTSTART).toString() === 'Invalid Date') {
                        console.log('Invalid date format. Please use YYYY-MM-DD.');
                    } else if (new Date(DTSTART) < new Date()) {
                        console.log('Date is in the past. Please choose a future date.');
                    }
                    DTSTART = await askQuestion('Enter the date for your appointment (YYYY-MM-DD): ');
                }

                // Check if the date is on a weekend or already reserved, and suggest next available date
                let fDate = new Date(DTSTART);      
                fDate.setUTCHours(9, 0, 0, 0); // Set to 9:00 AM UTC
                if (isWeekend(fDate) || isDateReserved(DTSTART) || isHoliday(fDate)) {
                    const suggestedDate = findNextAvailableDate(fDate);
                    let confirmNewDate;
                    let isValidResponse = false;

                    while (!isValidResponse) {
                        confirmNewDate = await askQuestion(`The requested date is not available. The next available date is ${suggestedDate}. Would you like to book on this date? (yes/no): `);
                        if (confirmNewDate.toLowerCase() === 'yes' || confirmNewDate.toLowerCase() === 'no') {
                            isValidResponse = true; // Valid input; exit the loop
                        } else {
                            console.log('Invalid input. Please type "yes" or "no".');
                        }
                    }

                    if (confirmNewDate.toLowerCase() === 'yes') {
                        DTSTART = suggestedDate; // User agrees to the suggested date
                    } else {
                        console.log('Reservation cancelled. No changes were made.');
                        break; // Exit the reservation process
                    }
                }

                // Proceed with reservation using the validated or suggested date
                let ATTENDEE = await askQuestion('Enter your email address: ');
                while (!/\S+@\S+\.\S+/.test(ATTENDEE)) { // Basic email validation
                    console.log('Invalid email address. Please enter a valid email.');
                    ATTENDEE = await askQuestion('Enter your email address: '); // Reassignment is now allowed with `let`
                }

                const DTSTAMP = new Date().toISOString();
                const METHOD = 'REQUEST';
                const STATUS = 'CONFIRMED';
                console.log('Confirming your reservation...');
                const confirmationCode = makeReservation({ DTSTART, ATTENDEE, DTSTAMP, METHOD, STATUS });
                console.log(`Reservation confirmed. Your confirmation code is: ${confirmationCode}`);
                break;
            case '3':
                // Lookup reservations logic
                const patientEmail = await askQuestion('Enter patient email: ');
                console.log('Looking up reservations...');
                const reservations = lookupReservations(patientEmail);

                if (reservations.length > 0) {
                    console.log(`Found ${reservations.length} reservation(s) for ${patientEmail}:`);
                    reservations.forEach((reservation, index) => {
                        console.log(`\nReservation:`);
                        console.log(`Date: ${convertFromICalendarFormat(reservation.DTSTART)}`);
                        console.log(`Email: ${reservation.ATTENDEE.replace("mailto:", "")}`);
                        console.log(`Timestamp: ${new Date(convertTimestampForDisplay(reservation.DTSTAMP)).toLocaleString()}`);
                        console.log(`Method: ${reservation.METHOD}`);
                        console.log(`Status: ${reservation.STATUS}`);
                        console.log(`Confirmation Code: ${reservation.confirmationCode}`);
                    });
                } else {
                    console.log('No reservations found for the provided email.');
                }
                break;
            case '4':
                // Cancel a reservation logic
                const code = await askQuestion('Enter confirmation code to cancel: ');
                console.log('Cancelling reservation...');
                const success = cancelReservation(code);
                if (success) console.log('Reservation cancelled successfully.');
                else console.log('Failed to cancel reservation.');
                break;
            case '5':
                console.log('Exiting...');
                rl.close();
                return;
            default:
                console.log('Invalid option, please try again.');
        }
    }
};

main().catch(err => console.error(err));