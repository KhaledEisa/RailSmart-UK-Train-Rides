-- ========================================
-- RAILWAY DATA ANALYSIS PROJECT
-- Description: End-to-end data cleaning, transformation, and analysis
-- ========================================
SELECT DB_NAME() AS CurrentDB;
SELECT name FROM sys.databases;
-- Preview the raw data inside the railway table
SELECT * 
FROM dbo.railway;


-- ========================================
-- DATA TYPE CONVERSION (DATA CLEANING)
-- ========================================

-- Convert date_of_journey column from TEXT to DATE for proper date operations
ALTER TABLE railway
ALTER COLUMN date_of_journey DATE;

-- Convert date_of_purchase column from TEXT to DATE
ALTER TABLE railway
ALTER COLUMN date_of_purchase DATE;

-- Convert departure_time from TEXT to TIME for time-based analysis
ALTER TABLE railway
ALTER COLUMN departure_time TIME;

-- Verify changes after data type conversion
SELECT * 
FROM dbo.railway;

-- ========================================
-- 1. OVERVIEW & BASIC STATISTICS
-- ========================================

-- Get total number of journeys (rows in dataset)
SELECT 
    COUNT(*) AS total_journeys
FROM railway;

-- Get date range and number of unique travel days
SELECT 
    MIN(date_of_journey) AS earliest_journey,   -- First journey date in dataset
    MAX(date_of_journey) AS latest_journey,     -- Last journey date in dataset
    COUNT(DISTINCT date_of_journey) AS total_days  -- Number of unique travel days
FROM railway;

-- Revenue summary and pricing statistics
SELECT 
    COUNT(*) AS total_bookings,                 -- Total number of bookings
    ROUND(SUM(price), 2) AS total_revenue,      -- Total revenue generated
    ROUND(AVG(price), 2) AS avg_ticket_price,   -- Average ticket price
    MIN(price) AS min_price,                   -- Cheapest ticket
    MAX(price) AS max_price                    -- Most expensive ticket
FROM railway;


-- ========================================
-- 2. ROUTE ANALYSIS
-- ========================================

-- Top 20 most popular routes based on number of journeys
SELECT TOP 20
    departure_station,                         -- Starting station
    arrival_destination,                       -- Destination station
    COUNT(*) AS journey_count,                 -- Number of trips on this route
    ROUND(AVG(price), 2) AS avg_price,         -- Average price for this route
    ROUND(SUM(price), 2) AS total_revenue      -- Total revenue from this route
FROM railway
GROUP BY departure_station, arrival_destination
ORDER BY journey_count DESC;                  -- Sort by most popular routes


-- ========================================
-- 3. DELAY ANALYSIS
-- ========================================

-- Analyze on-time vs delayed performance per route
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) AS total_journeys,                -- Total trips for the route

    -- Count of on-time journeys
    SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) AS on_time,

    -- Count of delayed journeys
    SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) AS delayed,

    -- Percentage of on-time performance
    ROUND(
        100.0 * SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) AS on_time_percentage

FROM railway
GROUP BY departure_station, arrival_destination

-- Only include routes with enough data for reliability
HAVING COUNT(*) >= 10

-- Show worst-performing routes first
ORDER BY on_time_percentage ASC;


-- ========================================
-- 4. DELAY BY TIME OF DAY
-- ========================================

-- Categorize trips into time periods and analyze delay rates
SELECT 
    CASE 
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 6 AND 9 THEN 'Morning Peak'
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 10 AND 15 THEN 'Midday'
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 16 AND 19 THEN 'Evening Peak'
        ELSE 'Off-Peak'
    END AS time_period,

    COUNT(*) AS journeys,                      -- Total journeys in this period

    -- Number of delayed journeys
    SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) AS delayed,

    -- Delay rate percentage
    ROUND(
        100.0 * SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) AS delay_rate

FROM railway

-- Group by same CASE logic
GROUP BY 
    CASE 
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 6 AND 9 THEN 'Morning Peak'
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 10 AND 15 THEN 'Midday'
        WHEN CAST(LEFT(departure_time, 2) AS INT) BETWEEN 16 AND 19 THEN 'Evening Peak'
        ELSE 'Off-Peak'
    END

ORDER BY delay_rate DESC;                     -- Show worst time periods first


-- ========================================
-- 5. PRICING ANALYSIS
-- ========================================

-- Analyze ticket pricing by ticket type
SELECT 
    ticket_type,                               -- Type (Advance, Anytime, etc.)
    COUNT(*) AS bookings,                      -- Number of bookings
    ROUND(AVG(price), 2) AS avg_price,         -- Average price
    MIN(price) AS min_price,                   -- Minimum price
    MAX(price) AS max_price                    -- Maximum price
FROM railway
GROUP BY ticket_type
ORDER BY avg_price DESC;                      -- Most expensive first


-- ========================================
-- 6. ADVANCE BOOKING ANALYSIS
-- ========================================

-- Analyze how booking in advance affects price
SELECT 
    DATEDIFF(DAY, date_of_purchase, date_of_journey) AS days_in_advance,

    COUNT(*) AS bookings,                      -- Number of bookings for each day difference
    ROUND(AVG(price), 2) AS avg_price          -- Average price for that booking gap

FROM railway

-- Only consider bookings within 0–60 days
WHERE DATEDIFF(DAY, date_of_purchase, date_of_journey) BETWEEN 0 AND 60

GROUP BY DATEDIFF(DAY, date_of_purchase, date_of_journey)
ORDER BY days_in_advance;


-- ========================================
-- 7. PAYMENT ANALYSIS
-- ========================================

-- Analyze customer payment behavior
SELECT 
    payment_method,                            -- Payment type (Card, Cash, etc.)
    COUNT(*) AS transactions,                  -- Number of transactions

    -- Percentage of total transactions
    ROUND(
        100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway), 
        2
    ) AS percentage,

    ROUND(AVG(price), 2) AS avg_transaction    -- Average transaction value

FROM railway
GROUP BY payment_method
ORDER BY transactions DESC;


-- ========================================
-- 8. DAY OF WEEK ANALYSIS
-- ========================================

-- Analyze demand by day of the week
SELECT 
    DATENAME(WEEKDAY, date_of_journey) AS day_of_week,  -- Day name (Monday, etc.)
    COUNT(*) AS journeys,
    ROUND(AVG(price), 2) AS avg_price
FROM railway
GROUP BY DATENAME(WEEKDAY, date_of_journey)
ORDER BY journeys DESC;


-- ========================================
-- 9. MONTHLY ANALYSIS
-- ========================================

-- Monthly trends in bookings and revenue
SELECT 
    FORMAT(date_of_journey, 'yyyy-MM') AS month, -- Format date to Year-Month
    COUNT(*) AS journeys,
    ROUND(SUM(price), 2) AS revenue,
    ROUND(AVG(price), 2) AS avg_price
FROM railway
GROUP BY FORMAT(date_of_journey, 'yyyy-MM')
ORDER BY month;


-- ========================================
-- 10. USER EXPERIENCE METRICS
-- ========================================

-- Measure service quality and customer satisfaction
SELECT 
    -- Percentage of on-time journeys
    ROUND(
        100.0 * SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) AS on_time_percentage,

    -- Customers without refund requests (proxy for satisfaction)
    ROUND(
        100.0 * SUM(CASE WHEN refund_request = 0 THEN 1 ELSE 0 END) / COUNT(*), 
        2
    ) AS satisfaction_rate,

    COUNT(*) AS total_journeys
FROM railway;