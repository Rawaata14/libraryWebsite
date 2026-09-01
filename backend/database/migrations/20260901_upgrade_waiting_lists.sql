-- =========================================================
-- 20260901_upgrade_waiting_lists.sql
--
-- תיאור הקובץ:
-- משדרג את טבלאות רשימות ההמתנה שכבר קיימות
-- במסד הנתונים.
--
-- השדרוג מוסיף:
-- - קישור בין המתנת ספר להזמנת מקום.
-- - זמני הצעה ותפוגה.
-- - זמני השלמה וביטול.
-- - סטטוסים חדשים.
-- - אינדקסים לשיפור ביצועים.
--
-- יש להריץ את הקובץ פעם אחת בלבד.
-- =========================================================

USE `librarywebsite`;

-- ---------------------------------------------------------
-- הסרת אילוצי UNIQUE ישנים
--
-- האילוצים הישנים מנעו ממשתמש להצטרף שוב
-- לרשימת המתנה לאחר שהמתנה קודמת הסתיימה.
-- מניעת כפילות פעילה מתבצעת כעת בלוגיקת השרת.
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_book`
  DROP INDEX IF EXISTS `uq_waiting_book_user`;

ALTER TABLE `waiting_list_seat`
  DROP INDEX IF EXISTS `uq_waiting_seat_request`;

-- ---------------------------------------------------------
-- שדרוג רשימת ההמתנה לספרים
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_book`
  ADD COLUMN IF NOT EXISTS `seatReservationId`
    INT NULL
    AFTER `userId`,

  ADD COLUMN IF NOT EXISTS `offeredAt`
    DATETIME NULL
    AFTER `createdAt`,

  ADD COLUMN IF NOT EXISTS `offerExpiresAt`
    DATETIME NULL
    AFTER `offeredAt`,

  ADD COLUMN IF NOT EXISTS `completedAt`
    DATETIME NULL
    AFTER `offerExpiresAt`,

  ADD COLUMN IF NOT EXISTS `cancelledAt`
    DATETIME NULL
    AFTER `completedAt`;

-- ---------------------------------------------------------
-- שדרוג רשימת ההמתנה למקומות
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_seat`
  ADD COLUMN IF NOT EXISTS `offeredAt`
    DATETIME NULL
    AFTER `createdAt`,

  ADD COLUMN IF NOT EXISTS `offerExpiresAt`
    DATETIME NULL
    AFTER `offeredAt`,

  ADD COLUMN IF NOT EXISTS `completedAt`
    DATETIME NULL
    AFTER `offerExpiresAt`,

  ADD COLUMN IF NOT EXISTS `cancelledAt`
    DATETIME NULL
    AFTER `completedAt`;

-- ---------------------------------------------------------
-- אינדקסים לרשימת ההמתנה לספרים
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_book`
  ADD INDEX IF NOT EXISTS `idx_book_queue`
    (
      `bookId`,
      `status`,
      `createdAt`,
      `queueBookId`
    ),

  ADD INDEX IF NOT EXISTS `idx_book_user`
    (
      `userId`,
      `status`
    ),

  ADD INDEX IF NOT EXISTS `idx_book_seat_reservation`
    (
      `seatReservationId`
    ),

  ADD INDEX IF NOT EXISTS `idx_book_offer_expiry`
    (
      `status`,
      `offerExpiresAt`
    );

-- ---------------------------------------------------------
-- אינדקסים לרשימת ההמתנה למקומות
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_seat`
  ADD INDEX IF NOT EXISTS `idx_seat_queue`
    (
      `seatId`,
      `requestedDate`,
      `requestedStartTime`,
      `requestedEndTime`,
      `status`,
      `createdAt`,
      `queueSeatId`
    ),

  ADD INDEX IF NOT EXISTS `idx_seat_user`
    (
      `userId`,
      `status`
    ),

  ADD INDEX IF NOT EXISTS `idx_seat_offer_expiry`
    (
      `status`,
      `offerExpiresAt`
    );

-- ---------------------------------------------------------
-- עדכון אילוץ הסטטוסים של המתנת ספר
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_book`
  DROP CONSTRAINT IF EXISTS `chk_waiting_book_status`;

ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `chk_waiting_book_status`
    CHECK (
      `status` IN (
        'waiting',
        'offered',
        'completed',
        'expired',
        'cancelled'
      )
    );

-- ---------------------------------------------------------
-- עדכון אילוץ הסטטוסים של המתנת מקום
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_seat`
  DROP CONSTRAINT IF EXISTS `chk_waiting_seat_status`;

ALTER TABLE `waiting_list_seat`
  ADD CONSTRAINT `chk_waiting_seat_status`
    CHECK (
      `status` IN (
        'waiting',
        'offered',
        'completed',
        'expired',
        'cancelled'
      )
    );

-- ---------------------------------------------------------
-- קישור המתנת ספר להזמנת המקום שנבחרה
--
-- הספר בפרויקט ניתן לשימוש רק במסגרת הזמנת
-- מקום תקפה, ולכן כל המתנת ספר נשמרת יחד עם
-- seatReservationId.
-- ---------------------------------------------------------

ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `fk_waiting_book_seat_reservation`
    FOREIGN KEY (`seatReservationId`)
    REFERENCES `seat_reservation` (`reservationId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;