/*
=========================================================
20260823_link_loans_to_seat_reservations.sql

תפקיד:
מקשר כל השאלת ספר להזמנת הכיסא שבמסגרתה
המשתמש רשאי להשתמש בספר.

יש להריץ את הקובץ פעם אחת בלבד על מסד נתונים קיים.

העמודה מאפשרת לדעת:
- לאיזה תאריך הספר הוזמן.
- מהי שעת קבלת הספר.
- מהי שעת החזרת הספר.
- האם הזמנת הכיסא שייכת למשתמש.
=========================================================
*/

ALTER TABLE `loan`
  ADD COLUMN `seatReservationId` int(11) DEFAULT NULL
    AFTER `bookId`,

  /*
  מונע שריון חוזר של אותו ספר
  במסגרת אותה הזמנת כיסא.
  */
  ADD UNIQUE KEY `uq_loan_reservation_book`
    (`seatReservationId`, `bookId`),

  /*
  משפר את מהירות שליפת הספרים
  השייכים להזמנת כיסא מסוימת.
  */
  ADD KEY `idx_loan_seat_reservation`
    (`seatReservationId`),

  /*
  מבטיח שהקישור מפנה להזמנת כיסא קיימת.
  */
  ADD CONSTRAINT `fk_loan_seat_reservation`
    FOREIGN KEY (`seatReservationId`)
    REFERENCES `seat_reservation` (`reservationId`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;