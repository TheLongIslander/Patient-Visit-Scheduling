// schedulerSpec.js
const {
    findNextAvailableDates,
    makeReservation,
    lookupReservations,
    cancelReservation,
    isDateReserved,
    findNextAvailableDate
  } = require('../reservationsHandler');
  const {
    isWeekend,
    formatDate,
    convertToICalendarFormat,
    convertFromICalendarFormat,
    isHoliday
  } = require('../utils');
  const fs = require('fs');
  
  describe("Doctor's Office Scheduler", () => {
    it("should correctly identify weekends", () => {
    let Date1 = new Date("2024-03-02T09:00:00.000Z");
    let Date2 = new Date("2024-03-03T09:00:00.000Z")
    let Date3 = new Date("2024-03-04T09:00:00.000Z")
      expect(isWeekend(Date1)).toBe(true); // Saturday
      expect(isWeekend(Date2)).toBe(true); // Sunday
      expect(isWeekend(Date3)).toBe(false); // Monday
    });
  
    it("should convert date to iCalendar format", () => {
      const dateStr = "2024-07-04";
      const timeStr = "09:00:00";
      expect(convertToICalendarFormat(dateStr, timeStr)).toEqual("20240704T090000Z");
    });
  
    it("should find the next available date excluding weekends and holidays", () => {
      const availableDate = findNextAvailableDate(new Date("2024-07-01"));
      expect(availableDate).not.toEqual("2024-07-04");
    });
  
    it("should make a reservation and return a confirmation code", () => {
      const reservationDetails = {
        DTSTART: "2024-07-05",
        ATTENDEE: "mailto:tomdurie24@gmail.com",
        METHOD: "REQUEST",
        STATUS: "CONFIRMED"
      };
      const confirmationCode = makeReservation(reservationDetails);
      expect(confirmationCode).toBeDefined();
    });
  
    it("should not allow reservations on holidays", () => {
      const reservationDetails = {
        DTSTART: "2024-07-04", // Assuming this is a holiday
        ATTENDEE: "holiday@example.com",
        METHOD: "REQUEST",
        STATUS: "CONFIRMED"
      };
      spyOn(console, 'log'); // To capture console.log output
      makeReservation(reservationDetails);
      expect(console.log).toHaveBeenCalledWith("The date falls on a weekend, is already reserved, or is a holiday.");
    });
  
    it("should look up reservations by email and find at least one reservation", () => {
      const email = "tomdurie24@gmail.com";
      const reservations = lookupReservations(email);
      expect(reservations.length).toBeGreaterThan(0);
    });
  
    it("should cancel a reservation and return true for success", async () => {
        const confirmationCode = "43b616a0"; // Use a real or mocked confirmation code
        const success = await cancelReservation(confirmationCode);
        expect(success).toBe(true);
    });
  
    it("should recognize a federal holiday", () => {
      const holiday = new Date("2024-07-04"); // Independence Day in the US
      expect(isHoliday(holiday)).toBe(true);
    });
  
    it("should find multiple available dates excluding weekends and holidays", () => {
      const startDate = new Date("2024-03-02T00:00:00.000Z");
      const availableDates = findNextAvailableDates(3, startDate);
      expect(availableDates.length).toBeGreaterThan(0);
    });
    it("should correctly format dates from iCalendar format", () => {
      const iCalendarDateTime = "20240704T090000Z";
      expect(convertFromICalendarFormat(iCalendarDateTime)).toEqual("2024-07-04");
    });
    it("should return true for date being reserved", () => {
      const reservedDate = "2024-07-05"; // Use a date known to be reserved
      expect(isDateReserved(reservedDate)).toBe(true);
    });
    it("should return false for date not being reserved", () => {
      const notReservedDate = "2024-08-01"; // Ensure this date is not reserved
      expect(isDateReserved(notReservedDate)).toBe(false);
    });
    it("should not allow duplicate reservations on the same day", async () => {
      const reservationDetails = {
        DTSTART: "2024-07-05", // Use a date already reserved to test
        ATTENDEE: "duplicate@example.com",
        METHOD: "REQUEST",
        STATUS: "CONFIRMED"
      };
      const confirmationCode = makeReservation(reservationDetails);
      expect(confirmationCode).toBeNull();
    });
    it("should not find reservations for an email with no reservations", () => {
      const email = "noreservations@example.com";
      const reservations = lookupReservations(email);
      expect(reservations.length).toBe(0);
    });
    it("should confirm that weekends are not available for reservation", () => {
      const startDate = new Date("2024-03-02"); // Saturday
      const availableDate = findNextAvailableDate(startDate);
      expect(new Date(availableDate).getDay()).not.toBe(6); // Ensures not Saturday
      expect(new Date(availableDate).getDay()).not.toBe(0); // Ensures not Sunday
    });
    it("should confirm that holidays are not available for reservation", () => {
      const holidayDate = "2024-07-04"; // Independence Day
      const availableDate = findNextAvailableDate(new Date(holidayDate));
      expect(availableDate).not.toEqual(holidayDate);
    });
    it("should successfully cancel a non-existent reservation and return false", async () => {
      const nonExistentCode = "nonexistent1234"; // Ensure this code does not exist
      const success = await cancelReservation(nonExistentCode);
      expect(success).toBe(false);
    });
    it("should handle leap year date formatting correctly", () => {
      expect(formatDate(new Date("2024-02-29"))).toEqual("2024-02-29");
    });  
  });
  