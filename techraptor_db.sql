-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 19, 2025 at 10:31 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `techraptor_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`, `description`, `image_url`, `created_at`) VALUES
(1, 'Laptops', 'High-performance laptops for work and gaming', '/uploads/categories/category-1763541982845-545972622.jpg', '2025-11-15 16:56:45'),
(2, 'PC Components', 'Graphics cards, processors, motherboards, and more', '/uploads/categories/category-1763542174207-411393697.jpg', '2025-11-15 16:56:45'),
(3, 'Mobile Phones', 'Latest smartphones from top brands', '/uploads/categories/category-1763542065809-588575861.jpg', '2025-11-15 16:56:45'),
(4, 'Tablets', 'Tablets for productivity and entertainment', '/uploads/categories/category-1763542220567-555758052.jpg', '2025-11-15 16:56:45'),
(5, 'Accessories', 'Mobile phone accessories and peripherals', '/uploads/categories/category-1763541866760-193402923.jpg', '2025-11-15 16:56:45');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `shipping_address` text NOT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_state` varchar(100) NOT NULL,
  `shipping_zip` varchar(20) NOT NULL,
  `shipping_country` varchar(100) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `status`, `shipping_address`, `shipping_city`, `shipping_state`, `shipping_zip`, `shipping_country`, `payment_method`, `payment_status`, `created_at`, `updated_at`) VALUES
(1, 2, 1999.99, 'pending', 'No.223\nBarandana', 'Hindagolla', 'North Western', '60034', 'Sri Lanka', 'credit_card', 'pending', '2025-11-15 17:34:56', '2025-11-15 17:42:06'),
(2, 3, 1999.99, 'pending', 'No.223\nBarandana', 'Hindagolla', 'North Western', '60034', 'Sri Lanka', 'cash_on_delivery', 'pending', '2025-11-19 07:46:35', '2025-11-19 07:46:35');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(1, 1, 2, 1, 1999.99),
(2, 2, 2, 1, 1999.99);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `specifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specifications`)),
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `category_id`, `product_name`, `description`, `specifications`, `price`, `stock_quantity`, `image_url`, `brand`, `model`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Dell XPS 15', 'Premium laptop with Intel i7 and 16GB RAM', NULL, 1499.99, 25, '/uploads/products/product-1763534045746-251833903.png', 'Dell', 'XPS-15-9520', 1, 1, '2025-11-15 16:56:45', '2025-11-19 06:34:05'),
(2, 1, 'MacBook Pro 14', 'Apple M2 Pro chip with 512GB SSD', NULL, 1999.99, 13, '/uploads/products/product-1763534752790-849775058.jpg', 'Apple', 'MBP14-2023', 1, 1, '2025-11-15 16:56:45', '2025-11-19 07:46:35'),
(3, 2, 'NVIDIA RTX 4070', 'High-performance graphics card', NULL, 599.99, 30, '/uploads/products/product-1763534827184-633169439.jpg', 'NVIDIA', 'RTX-4070', 1, 1, '2025-11-15 16:56:45', '2025-11-19 06:47:07'),
(4, 2, 'AMD Ryzen 9 7950X', 'Top-tier processor for gaming and productivity', NULL, 549.99, 20, '/uploads/products/product-1763535150902-466343409.jpg', 'AMD', '7950X', 0, 1, '2025-11-15 16:56:45', '2025-11-19 06:52:30'),
(5, 3, 'iPhone 15 Pro', '256GB with titanium design', NULL, 1099.99, 40, '/uploads/products/product-1763542275204-350935667.jpg', 'Apple', 'iPhone-15-Pro', 1, 1, '2025-11-15 16:56:45', '2025-11-19 08:51:15'),
(6, 3, 'Samsung Galaxy S24 Ultra', '512GB flagship smartphone', NULL, 1299.99, 35, '/uploads/products/product-1763535423792-905310131.jpg', 'Samsung', 'S24-Ultra', 1, 1, '2025-11-15 16:56:45', '2025-11-19 06:57:03'),
(7, 4, 'iPad Pro 12.9', 'M2 chip with 256GB storage', NULL, 1099.99, 20, '/uploads/products/product-1763535764542-407287915.jpg', 'Apple', 'iPad-Pro-12.9', 0, 1, '2025-11-15 16:56:45', '2025-11-19 07:02:44'),
(8, 5, 'AirPods Pro 2', 'Active noise cancellation', NULL, 249.99, 100, '/uploads/products/product-1763535820542-187807236.jpg', 'Apple', 'AirPods-Pro-2', 0, 1, '2025-11-15 16:56:45', '2025-11-19 07:03:40');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('customer','admin') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(2, 'Mohamed', 'Shabri', 'shabri@gmail.com', '$2b$12$RSSuslE0b0E53vTX4JUt4OHJFSMc1SD4yDAX2kyKIKpqOUL7orx5y', '0771234567', 'customer', '2025-11-15 17:23:23', '2025-11-19 09:29:50'),
(3, 'Menad', 'Bandara', 'menad@gmail.com', '$2b$12$NYC.srlBZ.w0hGtIqMU5EeqeNwO1zc1z4vSJYmLuFN5/OELwzPkBW', '0721122611', 'customer', '2025-11-19 06:49:26', '2025-11-19 06:49:26'),
(4, 'Admin', 'User', 'admin@techraptor.com', '$2b$12$TlBWO4fM7c9drKarvSJGIun2H0Vewvy2Y9g9JKdFh2H0wmqy55P7i', '0714114444', 'admin', '2025-11-19 09:29:21', '2025-11-19 09:29:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_order` (`order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_price` (`price`),
  ADD KEY `idx_featured` (`is_featured`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
