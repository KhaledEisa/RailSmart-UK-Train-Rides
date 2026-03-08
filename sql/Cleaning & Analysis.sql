-- ========================================
-- 1. OVERVIEW & BASIC STATISTICS
-- ========================================

-- Total number of journeys
SELECT COUNT(*) as total_journeys FROM railway;

-- Date range of data
SELECT 
    MIN(date_of_journey) as earliest_journey,
    MAX(date_of_journey) as latest_journey,
    COUNT(DISTINCT date_of_journey) as total_days
FROM railway;

-- Revenue summary
SELECT 
    COUNT(*) as total_bookings,
    ROUND(SUM(price), 2) as total_revenue,
    ROUND(AVG(price), 2) as avg_ticket_price,
    ROUND(MIN(price), 2) as min_price,
    ROUND(MAX(price), 2) as max_price
FROM railway;


-- ========================================
-- 2. ROUTE ANALYSIS
-- ========================================

-- Most popular routes
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as journey_count,
    ROUND(AVG(price), 2) as avg_price,
    ROUND(SUM(price), 2) as total_revenue
FROM railway
GROUP BY departure_station, arrival_destination
ORDER BY journey_count DESC
LIMIT 20;

-- Busiest departure stations
SELECT 
    departure_station,
    COUNT(*) as departures,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY departure_station
ORDER BY departures DESC
LIMIT 10;

-- Busiest arrival destinations
SELECT 
    arrival_destination,
    COUNT(*) as arrivals,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY arrival_destination
ORDER BY arrivals DESC
LIMIT 10;


-- ========================================
-- 3. DELAY ANALYSIS (CRITICAL FOR YOUR APP)
-- ========================================

-- On-time performance by route
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as total_journeys,
    SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) as on_time,
    SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) as delayed,
    ROUND(100.0 * SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) / COUNT(*), 2) as on_time_percentage
FROM railway
GROUP BY departure_station, arrival_destination
HAVING COUNT(*) >= 10
ORDER BY on_time_percentage ASC
LIMIT 20;

-- Delay reasons breakdown
SELECT 
    reason_for_delay,
    COUNT(*) as delay_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway WHERE journey_status = 'Delayed'), 2) as percentage
FROM railway
WHERE reason_for_delay IS NOT NULL AND reason_for_delay != ''
GROUP BY reason_for_delay
ORDER BY delay_count DESC;

-- Delays by time of day
SELECT 
    CASE 
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) BETWEEN 6 AND 9 THEN 'Morning Peak (6-9)'
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) BETWEEN 10 AND 15 THEN 'Midday (10-15)'
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) BETWEEN 16 AND 19 THEN 'Evening Peak (16-19)'
        ELSE 'Off-Peak'
    END as time_period,
    COUNT(*) as journeys,
    SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) as delayed,
    ROUND(100.0 * SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) / COUNT(*), 2) as delay_rate
FROM railway
GROUP BY time_period
ORDER BY delay_rate DESC;


-- ========================================
-- 4. PRICING ANALYSIS (FOR BOOKING ALERTS)
-- ========================================

-- Price by ticket type
SELECT 
    ticket_type,
    COUNT(*) as bookings,
    ROUND(AVG(price), 2) as avg_price,
    ROUND(MIN(price), 2) as min_price,
    ROUND(MAX(price), 2) as max_price
FROM railway
GROUP BY ticket_type
ORDER BY avg_price DESC;

-- Best deals: Advance tickets vs Anytime
SELECT 
    departure_station,
    arrival_destination,
    ROUND(AVG(CASE WHEN ticket_type = 'Advance' THEN price END), 2) as advance_avg,
    ROUND(AVG(CASE WHEN ticket_type = 'Anytime' THEN price END), 2) as anytime_avg,
    ROUND(AVG(CASE WHEN ticket_type = 'Anytime' THEN price END) - 
          AVG(CASE WHEN ticket_type = 'Advance' THEN price END), 2) as potential_savings
FROM railway
GROUP BY departure_station, arrival_destination
HAVING advance_avg IS NOT NULL AND anytime_avg IS NOT NULL
ORDER BY potential_savings DESC
LIMIT 20;

-- Price by purchase channel
SELECT 
    purchase_type,
    COUNT(*) as bookings,
    ROUND(AVG(price), 2) as avg_price,
    ROUND(SUM(price), 2) as total_revenue
FROM railway
GROUP BY purchase_type
ORDER BY bookings DESC;

-- Price trends by advance booking days
SELECT 
    CAST((julianday(date_of_journey) - julianday(date_of_purchase)) AS INTEGER) as days_in_advance,
    COUNT(*) as bookings,
    ROUND(AVG(price), 2) as avg_price
FROM railway
WHERE days_in_advance >= 0 AND days_in_advance <= 60
GROUP BY days_in_advance
ORDER BY days_in_advance;


-- ========================================
-- 5. REFUND ANALYSIS
-- ========================================

-- Refund request rate by journey status
SELECT 
    journey_status,
    COUNT(*) as total_journeys,
    SUM(CASE WHEN refund_request = 'Yes' THEN 1 ELSE 0 END) as refund_requests,
    ROUND(100.0 * SUM(CASE WHEN refund_request = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) as refund_rate,
    ROUND(SUM(CASE WHEN refund_request = 'Yes' THEN price ELSE 0 END), 2) as potential_refund_cost
FROM railway
GROUP BY journey_status;

-- Routes with highest refund rates
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as journeys,
    SUM(CASE WHEN refund_request = 'Yes' THEN 1 ELSE 0 END) as refunds,
    ROUND(100.0 * SUM(CASE WHEN refund_request = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) as refund_rate
FROM railway
GROUP BY departure_station, arrival_destination
HAVING COUNT(*) >= 20
ORDER BY refund_rate DESC
LIMIT 15;


-- ========================================
-- 6. CUSTOMER BEHAVIOR ANALYSIS
-- ========================================

-- Payment method preferences
SELECT 
    payment_method,
    COUNT(*) as transactions,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway), 2) as percentage,
    ROUND(AVG(price), 2) as avg_transaction
FROM railway
GROUP BY payment_method
ORDER BY transactions DESC;

-- Railcard usage analysis
SELECT 
    railcard,
    COUNT(*) as bookings,
    ROUND(AVG(price), 2) as avg_price,
    ROUND(SUM(price), 2) as total_revenue
FROM railway
GROUP BY railcard
ORDER BY bookings DESC;

-- Ticket class preference
SELECT 
    ticket_class,
    COUNT(*) as bookings,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway), 2) as percentage,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY ticket_class;


-- ========================================
-- 7. TEMPORAL ANALYSIS
-- ========================================

-- Bookings by day of week
SELECT 
    CASE CAST(strftime('%w', date_of_journey) AS INTEGER)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_of_week,
    COUNT(*) as journeys,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY day_of_week
ORDER BY journeys DESC;

-- Bookings by month
SELECT 
    strftime('%Y-%m', date_of_journey) as month,
    COUNT(*) as journeys,
    ROUND(SUM(price), 2) as revenue,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY month
ORDER BY month;

-- Peak vs off-peak journey times
SELECT 
    CASE 
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) BETWEEN 7 AND 9 THEN 'Morning Peak'
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) BETWEEN 16 AND 18 THEN 'Evening Peak'
        ELSE 'Off-Peak'
    END as period,
    COUNT(*) as journeys,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY period;


-- ========================================
-- 8. ACTIONABLE INSIGHTS FOR YOUR APP
-- ========================================

-- Best time to travel (least delays) by route
SELECT 
    departure_station,
    arrival_destination,
    CASE 
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) < 12 THEN 'Morning'
        WHEN CAST(substr(departure_time, 1, 2) AS INTEGER) < 17 THEN 'Afternoon'
        ELSE 'Evening'
    END as time_of_day,
    COUNT(*) as journeys,
    ROUND(100.0 * SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) / COUNT(*), 2) as on_time_rate,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY departure_station, arrival_destination, time_of_day
HAVING journeys >= 10
ORDER BY on_time_rate DESC;

-- Routes where advance booking saves the most money
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as total_bookings,
    ROUND(AVG(CASE WHEN ticket_type = 'Advance' THEN price END), 2) as advance_price,
    ROUND(AVG(CASE WHEN ticket_type NOT IN ('Advance') THEN price END), 2) as regular_price,
    ROUND(AVG(CASE WHEN ticket_type NOT IN ('Advance') THEN price END) - 
          AVG(CASE WHEN ticket_type = 'Advance' THEN price END), 2) as savings
FROM railway
GROUP BY departure_station, arrival_destination
HAVING advance_price IS NOT NULL AND regular_price IS NOT NULL
ORDER BY savings DESC
LIMIT 20;

-- High-risk delay routes (for app warnings)
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as total_journeys,
    ROUND(100.0 * SUM(CASE WHEN journey_status = 'Delayed' THEN 1 ELSE 0 END) / COUNT(*), 2) as delay_rate,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY departure_station, arrival_destination
HAVING total_journeys >= 50
ORDER BY delay_rate DESC
LIMIT 20;


-- ========================================
-- 9. REVENUE OPTIMIZATION INSIGHTS
-- ========================================

-- Revenue by route
SELECT 
    departure_station,
    arrival_destination,
    COUNT(*) as journeys,
    ROUND(SUM(price), 2) as total_revenue,
    ROUND(AVG(price), 2) as avg_price
FROM railway
GROUP BY departure_station, arrival_destination
ORDER BY total_revenue DESC
LIMIT 20;

-- Most profitable days
SELECT 
    date_of_journey,
    COUNT(*) as journeys,
    ROUND(SUM(price), 2) as revenue
FROM railway
GROUP BY date_of_journey
ORDER BY revenue DESC
LIMIT 10;


-- ========================================
-- 10. USER EXPERIENCE METRICS
-- ========================================

-- Overall service quality score
SELECT 
    ROUND(100.0 * SUM(CASE WHEN journey_status = 'On Time' THEN 1 ELSE 0 END) / COUNT(*), 2) as on_time_percentage,
    ROUND(100.0 * SUM(CASE WHEN refund_request = 'No' THEN 1 ELSE 0 END) / COUNT(*), 2) as satisfaction_rate,
    COUNT(*) as total_journeys
FROM railway;

-- Customer satisfaction proxy (no delays + no refund requests)
SELECT 
    'Satisfied' as category,
    COUNT(*) as customers,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway), 2) as percentage
FROM railway
WHERE journey_status = 'On Time' AND refund_request = 'No'
UNION ALL
SELECT 
    'Unsatisfied' as category,
    COUNT(*) as customers,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM railway), 2) as percentage
FROM railway
WHERE journey_status = 'Delayed' OR refund_request = 'Yes';