-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2026 at 10:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `librarywebsite`
--

CREATE DATABASE IF NOT EXISTS `librarywebsite`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `librarywebsite`;

-- --------------------------------------------------------

--
-- Table structure for table `book`
--

CREATE TABLE `book` (
  `bookId` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `author` varchar(100) DEFAULT NULL,
  `publishYear` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'available',
  `total_quantity` int(11) NOT NULL DEFAULT 1,
  `category` varchar(100) NOT NULL DEFAULT 'General',
  `book_image_name` varchar(255) DEFAULT NULL,
  `available_quantity` int(11) NOT NULL,
  `isbn` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book`
--

INSERT INTO `book` (`bookId`, `title`, `author`, `publishYear`, `status`, `total_quantity`, `category`, `book_image_name`, `available_quantity`, `isbn`) VALUES
(1, 'harry potter and the deathly hallows', 'J.K. Rowling', 2007, 'available', 4, 'Fantasy', '1778694179358-81aCMT1zKtL.jpg', 4, '978-0545010221');

-- --------------------------------------------------------

--
-- Table structure for table `loan`
--

CREATE TABLE `loan` (
  `loanId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `bookId` int(11) NOT NULL,
  `loanDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `returnDate` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notificationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `message` text NOT NULL,
  `sentDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seat`
--

CREATE TABLE `seat` (
  `seatId` int(11) NOT NULL,
  `location` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'available',
  `type` varchar(50) NOT NULL,
  `x` float NOT NULL,
  `y` float NOT NULL,
  `rotation` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seat_reservation`
--

CREATE TABLE `seat_reservation` (
  `reservationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `seatId` int(11) NOT NULL,
  `reservationDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'confirmed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_log`
--

CREATE TABLE `system_log` (
  `logId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `actionType` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `module` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `messageId` int(11) NOT NULL,
  `senderName` varchar(100) NOT NULL,
  `senderEmail` varchar(100) NOT NULL,
  `messageText` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `isRead` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userId` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'reader',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastLoginAt` timestamp NULL DEFAULT NULL,
  `profile_image_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`userId`, `fullName`, `email`, `phone`, `passwordHash`, `role`, `status`, `createdAt`, `profile_image_name`) VALUES
(1, 'Rawaa Tareef', 'rawatareef1@gmail.com', NULL, '$2b$10$9h2I.bqSxw.lccsv2tR6Eetyv1.uZcHPhdxLqMKWeXH6LNMBzyBkq', 'librarian', 'active', '2026-05-05 11:07:26', NULL),
(2, 'Arjwan Abied', 'Arjwan.abied@gmail.com', NULL, '$2b$10$.DdEoyVR5LN0LVkpA8iOS.EI5EdUSpuxbTQsPhJqVgfkfyZwkNORm', 'librarian', 'active', '2026-05-05 11:30:44', '1780327895795-ArjwanP.png'),
(12, 'ADLA', 'ADLA@GMAIL.COM', NULL, '$2b$10$FU3CsfBmwqOzMcZGLgz/aubw.2izGIYseW/BAlh2nwFEBosBo7yB6', 'reader', 'active', '2026-05-05 12:21:57', NULL),
(13, 'Demo Librarian', 'librarian@library.com', NULL, '$2b$10$mi0Kfw5yAotBg3qwS0Asyepeq3HITGnTuK14AzVa55a0iY4dNSaDO', 'librarian', 'active', CURRENT_TIMESTAMP, NULL),
(14, 'Demo Reader', 'reader@library.com', NULL, '$2b$10$ldYsI2bDTHUyDDJ4J8pz3.4fECsqJs615rnbnOiwsitU5q3WATnAK', 'reader', 'active', CURRENT_TIMESTAMP, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `waiting_list_book`
--

CREATE TABLE `waiting_list_book` (
  `queueBookId` int(11) NOT NULL,
  `bookId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `position` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'waiting',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `waiting_list_seat`
--

CREATE TABLE `waiting_list_seat` (
  `queueSeatId` int(11) NOT NULL,
  `seatId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `requestedDate` date NOT NULL,
  `requestedStartTime` time NOT NULL,
  `requestedEndTime` time NOT NULL,
  `position` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'waiting',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `book`
--
ALTER TABLE `book`
  ADD PRIMARY KEY (`bookId`),
  ADD UNIQUE KEY `isbn` (`isbn`);

--
-- Indexes for table `loan`
--
ALTER TABLE `loan`
  ADD PRIMARY KEY (`loanId`),
  ADD KEY `idx_loan_user_status_due`
    (`userId`, `status`, `dueDate`),
  ADD KEY `idx_loan_book_status`
    (`bookId`, `status`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `idx_notification_user_read_date`
    (`userId`, `isRead`, `sentDate`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`messageId`),
  ADD KEY `isRead` (`isRead`),
  ADD KEY `createdAt` (`createdAt`);

--
-- Indexes for table `seat`
--
ALTER TABLE `seat`
  ADD PRIMARY KEY (`seatId`);

--
-- Indexes for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  ADD PRIMARY KEY (`reservationId`),
  ADD KEY `idx_reservation_user_date`
    (`userId`, `reservationDate`, `status`),
  ADD KEY `idx_reservation_seat_date_time`
    (`seatId`, `reservationDate`, `status`, `startTime`, `endTime`);

--
-- Indexes for table `system_log`
--
ALTER TABLE `system_log`
  ADD PRIMARY KEY (`logId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  ADD PRIMARY KEY (`queueBookId`),
  ADD UNIQUE KEY `uq_waiting_book_user`
    (`bookId`, `userId`),
  ADD KEY `idx_waiting_book_user`
    (`userId`),
  ADD KEY `idx_waiting_book_queue`
    (`bookId`, `status`, `position`);

--
-- Indexes for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD PRIMARY KEY (`queueSeatId`),
  ADD UNIQUE KEY `uq_waiting_seat_request`
    (`seatId`, `userId`, `requestedDate`,
     `requestedStartTime`, `requestedEndTime`),
  ADD KEY `idx_waiting_seat_user`
    (`userId`),
  ADD KEY `idx_waiting_seat_queue`
    (`seatId`, `requestedDate`, `status`, `position`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `book`
--
ALTER TABLE `book`
  MODIFY `bookId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `loan`
--
ALTER TABLE `loan`
  MODIFY `loanId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `notificationId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `messageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seat`
--
ALTER TABLE `seat`
  MODIFY `seatId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  MODIFY `reservationId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_log`
--
ALTER TABLE `system_log`
  MODIFY `logId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  MODIFY `queueBookId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  MODIFY `queueSeatId` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Data validation constraints
--

--
-- Validation for table `book`
--
ALTER TABLE `book`
  ADD CONSTRAINT `chk_book_total_quantity`
    CHECK (`total_quantity` >= 1),
  ADD CONSTRAINT `chk_book_available_quantity`
    CHECK (
      `available_quantity` >= 0
      AND `available_quantity` <= `total_quantity`
    ),
  ADD CONSTRAINT `chk_book_publish_year`
    CHECK (
      `publishYear` IS NULL
      OR `publishYear` BETWEEN 1000 AND 2100
    );

--
-- Validation for table `loan`
--
ALTER TABLE `loan`
  ADD CONSTRAINT `chk_loan_due_date`
    CHECK (`dueDate` >= `loanDate`),
  ADD CONSTRAINT `chk_loan_return_date`
    CHECK (
      `returnDate` IS NULL
      OR `returnDate` >= `loanDate`
    );

--
-- Validation for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  ADD CONSTRAINT `chk_reservation_time_order`
    CHECK (`startTime` < `endTime`),
  ADD CONSTRAINT `chk_reservation_opening_hours`
    CHECK (
      `startTime` >= '08:00:00'
      AND `endTime` <= '20:00:00'
    );

--
-- Validation for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `chk_waiting_book_position`
    CHECK (`position` IS NULL OR `position` >= 1);

--
-- Validation for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD CONSTRAINT `chk_waiting_seat_time_order`
    CHECK (`requestedStartTime` < `requestedEndTime`),
  ADD CONSTRAINT `chk_waiting_seat_opening_hours`
    CHECK (
      `requestedStartTime` >= '08:00:00'
      AND `requestedEndTime` <= '20:00:00'
    ),
  ADD CONSTRAINT `chk_waiting_seat_position`
    CHECK (`position` IS NULL OR `position` >= 1);

--
-- Role and status validation for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `chk_user_role`
    CHECK (`role` IN ('reader', 'librarian')),
  ADD CONSTRAINT `chk_user_status`
    CHECK (`status` IN ('active', 'blocked'));

--
-- Status validation for table `book`
--
ALTER TABLE `book`
  ADD CONSTRAINT `chk_book_status`
    CHECK (`status` IN ('available', 'unavailable'));

--
-- Status validation for table `loan`
--
ALTER TABLE `loan`
  ADD CONSTRAINT `chk_loan_status`
    CHECK (`status` IN ('active', 'late', 'returned'));

--
-- Status validation for table `seat`
--
ALTER TABLE `seat`
  ADD CONSTRAINT `chk_seat_status`
    CHECK (`status` IN ('available', 'blocked'));

--
-- Status validation for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  ADD CONSTRAINT `chk_reservation_status`
    CHECK (`status` IN ('confirmed', 'cancelled', 'completed'));

--
-- Status validation for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `chk_waiting_book_status`
    CHECK (
      `status` IN ('waiting', 'notified', 'completed', 'cancelled')
    );

--
-- Status validation for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD CONSTRAINT `chk_waiting_seat_status`
    CHECK (
      `status` IN ('waiting', 'notified', 'completed', 'cancelled')
    );

--
-- Constraints for dumped tables
--

--
-- Constraints for table `loan`
--
ALTER TABLE `loan`
  ADD CONSTRAINT `fk_loan_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_loan_book`
    FOREIGN KEY (`bookId`) REFERENCES `book` (`bookId`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

--
-- Constraints for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  ADD CONSTRAINT `fk_reservation_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservation_seat`
    FOREIGN KEY (`seatId`) REFERENCES `seat` (`seatId`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

--
-- Constraints for table `system_log`
--
ALTER TABLE `system_log`
  ADD CONSTRAINT `fk_system_log_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

--
-- Constraints for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `fk_waiting_book`
    FOREIGN KEY (`bookId`) REFERENCES `book` (`bookId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_waiting_book_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

--
-- Constraints for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD CONSTRAINT `fk_waiting_seat`
    FOREIGN KEY (`seatId`) REFERENCES `seat` (`seatId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_waiting_seat_user`
    FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
