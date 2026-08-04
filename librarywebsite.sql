-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
<<<<<<< HEAD
-- Generation Time: May 19, 2026 at 01:17 PM
=======
-- Generation Time: Jun 02, 2026 at 10:41 AM
>>>>>>> dde369358a0db2f0fca1e139b9f711743617d516
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

-- --------------------------------------------------------

--
-- Table structure for table `book`
--

CREATE TABLE `book` (
  `bookId` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `author` varchar(100) DEFAULT NULL,
  `publishYear` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'available',
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
  `userId` int(11) DEFAULT NULL,
  `bookId` int(11) DEFAULT NULL,
  `loanDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `returnDate` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notificationId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `sentDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(30) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;NGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seat`
--

CREATE TABLE `seat` (
  `seatId` int(11) NOT NULL,
  `location` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'available',
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
  `userId` int(11) DEFAULT NULL,
  `seatId` int(11) DEFAULT NULL,
  `reservationDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `status` varchar(20) DEFAULT 'pending'
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
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userId` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` varchar(20) DEFAULT 'reader',
  `status` varchar(20) DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `profile_image_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`userId`, `fullName`, `email`, `phone`, `passwordHash`, `role`, `status`, `createdAt`, `profile_image_name`) VALUES
(1, 'Rawaa Tareef', 'rawatareef1@gmail.com', NULL, '$2b$10$9h2I.bqSxw.lccsv2tR6Eetyv1.uZcHPhdxLqMKWeXH6LNMBzyBkq', 'librarian', 'active', '2026-05-05 11:07:26', NULL),
(2, 'Arjwan Abied', 'Arjwan.abied@gmail.com', NULL, '$2b$10$.DdEoyVR5LN0LVkpA8iOS.EI5EdUSpuxbTQsPhJqVgfkfyZwkNORm', 'librarian', 'active', '2026-05-05 11:30:44', '1780327895795-ArjwanP.png'),
(12, 'ADLA', 'ADLA@GMAIL.COM', NULL, '$2b$10$FU3CsfBmwqOzMcZGLgz/aubw.2izGIYseW/BAlh2nwFEBosBo7yB6', 'reader', 'active', '2026-05-05 12:21:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `waiting_list_book`
--

CREATE TABLE `waiting_list_book` (
  `queueBookId` int(11) NOT NULL,
  `bookId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'waiting',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `waiting_list_seat`
--

CREATE TABLE `waiting_list_seat` (
  `queueSeatId` int(11) NOT NULL,
  `seatId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `requestedDate` date DEFAULT NULL,
  `requestedStartTime` time DEFAULT NULL,
  `requestedEndTime` time DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'waiting',
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
  ADD KEY `userId` (`userId`),
  ADD KEY `bookId` (`bookId`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `userId` (`userId`);

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
  ADD KEY `userId` (`userId`),
  ADD KEY `seatId` (`seatId`);

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
  ADD KEY `bookId` (`bookId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD PRIMARY KEY (`queueSeatId`),
  ADD KEY `seatId` (`seatId`),
  ADD KEY `userId` (`userId`);

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
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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

--
-- Constraints for dumped tables
--

--
-- Constraints for table `loan`
--
ALTER TABLE `loan`
  ADD CONSTRAINT `loan_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`),
  ADD CONSTRAINT `loan_ibfk_2` FOREIGN KEY (`bookId`) REFERENCES `book` (`bookId`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`);

--
-- Constraints for table `seat_reservation`
--
ALTER TABLE `seat_reservation`
  ADD CONSTRAINT `seat_reservation_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`),
  ADD CONSTRAINT `seat_reservation_ibfk_2` FOREIGN KEY (`seatId`) REFERENCES `seat` (`seatId`);

--
-- Constraints for table `system_log`
--
ALTER TABLE `system_log`
  ADD CONSTRAINT `system_log_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`);

--
-- Constraints for table `waiting_list_book`
--
ALTER TABLE `waiting_list_book`
  ADD CONSTRAINT `waiting_list_book_ibfk_1` FOREIGN KEY (`bookId`) REFERENCES `book` (`bookId`),
  ADD CONSTRAINT `waiting_list_book_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`);

--
-- Constraints for table `waiting_list_seat`
--
ALTER TABLE `waiting_list_seat`
  ADD CONSTRAINT `waiting_list_seat_ibfk_1` FOREIGN KEY (`seatId`) REFERENCES `seat` (`seatId`),
  ADD CONSTRAINT `waiting_list_seat_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
