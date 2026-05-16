# Database Design - RailSmart UK Train Rides

## Overview
The RailSmart database is designed to store and manage comprehensive UK railway operational data. The schema supports efficient querying, analysis, and reporting while maintaining data integrity and performance.

## Database Architecture

### Technology Stack
- **DBMS**: PostgreSQL (recommended) or SQL Server
- **Design Pattern**: Normalized relational model
- **Scalability**: Partitioned by date for large datasets
- **Backup**: Daily automated backups with point-in-time recovery

## Entity Relationship Diagram (ERD)

### Core Entities

#### 1. STATIONS
```sql
Table: stations
- station_id (PK)
- station_code (UNIQUE)
- station_name
- region
- latitude
- longitude
- station_type
- operating_company_id (FK)
- created_date
- last_updated
```

#### 2. TRAIN_SERVICES
```sql
Table: train_services
- service_id (PK)
- service_code (UNIQUE)
- route_id (FK)
- operator_id (FK)
- train_type
- capacity
- average_speed
- first_service_date
- last_modified_date
```

#### 3. ROUTES
```sql
Table: routes
- route_id (PK)
- route_code (UNIQUE)
- origin_station_id (FK)
- destination_station_id (FK)
- distance_km
- estimated_duration_minutes
- stops_count
- region
- created_date
```

#### 4. JOURNEYS
```sql
Table: journeys
- journey_id (PK)
- service_id (FK)
- journey_date
- scheduled_departure
- scheduled_arrival
- actual_departure
- actual_arrival
- status (ON_TIME, DELAYED, CANCELLED)
- delay_minutes
- passenger_count
- revenue
- created_date
```

#### 5. JOURNEY_STOPS
```sql
Table: journey_stops
- stop_id (PK)
- journey_id (FK)
- station_id (FK)
- scheduled_arrival
- scheduled_departure
- actual_arrival
- actual_departure
- stop_sequence
- passengers_boarded
- passengers_alighted
```

#### 6. OPERATING_COMPANIES
```sql
Table: operating_companies
- company_id (PK)
- company_name (UNIQUE)
- company_code (UNIQUE)
- headquarters_location
- founded_year
- total_stations
- status (ACTIVE, INACTIVE)
- contact_email
```

#### 7. PERFORMANCE_METRICS
```sql
Table: performance_metrics
- metric_id (PK)
- date
- service_id (FK)
- route_id (FK)
- operator_id (FK)
- on_time_performance
- cancellation_rate
- average_delay_minutes
- passenger_satisfaction_score
- reliability_score
- created_date
```

#### 8. PASSENGERS
```sql
Table: passengers (Optional - for privacy compliance)
- passenger_id (PK)
- anonymized_id
- journey_id (FK)
- ticket_type
- fare_paid
- booking_date
- travel_date
- created_date
```

## Data Dictionary

### Column Definitions

| Table | Column | Type | Constraints | Description |
|-------|--------|------|-----------|-------------|
| stations | station_id | INT | PK, AUTO_INC | Unique station identifier |
| stations | station_code | VARCHAR(10) | UNIQUE, NOT NULL | Official station code (e.g., KGX) |
| stations | station_name | VARCHAR(100) | NOT NULL | Full station name |
| stations | region | VARCHAR(50) | | UK region/area |
| stations | latitude | DECIMAL(10,8) | | Geographic latitude |
| stations | longitude | DECIMAL(11,8) | | Geographic longitude |
| train_services | service_id | INT | PK, AUTO_INC | Unique service identifier |
| train_services | capacity | INT | | Total passenger capacity |
| journeys | journey_id | BIGINT | PK, AUTO_INC | Unique journey identifier |
| journeys | status | ENUM | | Journey status code |
| journeys | delay_minutes | INT | DEFAULT 0 | Actual delay in minutes |
| performance_metrics | on_time_performance | DECIMAL(5,2) | | Percentage 0-100 |

## Indexing Strategy

### Primary Indexes
```sql
-- Frequently queried columns
CREATE INDEX idx_journeys_date ON journeys(journey_date);
CREATE INDEX idx_journeys_service ON journeys(service_id);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journey_stops_journey ON journey_stops(journey_id);
CREATE INDEX idx_routes_stations ON routes(origin_station_id, destination_station_id);
CREATE INDEX idx_performance_date_service ON performance_metrics(date, service_id);
```

### Composite Indexes
```sql
-- Multi-column queries
CREATE INDEX idx_journeys_date_status ON journeys(journey_date, status);
CREATE INDEX idx_performance_date_operator ON performance_metrics(date, operator_id);
```

## Normalization & Integrity

### Normalization Level: 3NF
- All non-key attributes are dependent only on the primary key
- No transitive dependencies
- Eliminates redundancy while maintaining queryability

### Referential Integrity
- Foreign key constraints enforce relational integrity
- Cascade delete policies defined for dependent records
- Check constraints for valid enumeration values

### Data Validation Rules

```sql
-- Sample constraint examples
ALTER TABLE journeys ADD CONSTRAINT chk_delay_positive 
  CHECK (delay_minutes >= 0);

ALTER TABLE journeys ADD CONSTRAINT chk_times_logical 
  CHECK (scheduled_arrival > scheduled_departure);

ALTER TABLE performance_metrics ADD CONSTRAINT chk_percentage 
  CHECK (on_time_performance >= 0 AND on_time_performance <= 100);
```

## Partitioning Strategy

### Time-Based Partitioning
Partition journeys table by month to optimize query performance:

```sql
-- Example: Partition journeys table by month
PARTITION BY RANGE (YEAR(journey_date), MONTH(journey_date))
```

### Benefits
- Faster queries on specific date ranges
- Easier data archival and deletion
- Improved backup/restore operations
- Better maintenance window management

## Security Design

### Access Control
- Role-based access control (RBAC)
- User role levels: Admin, Analyst, Operator, Viewer

### Data Privacy
- PII (Personally Identifiable Information) encryption
- Passenger data anonymization
- GDPR compliance measures
- Data retention policies

### Audit Trail
```sql
Table: audit_log
- log_id (PK)
- table_name
- operation (INSERT, UPDATE, DELETE)
- old_values
- new_values
- user_id
- timestamp
```

## Performance Optimization

### Query Optimization Techniques
1. **Denormalization** for frequently accessed computed values
2. **Materialized Views** for complex analytical queries
3. **Caching** for static reference data
4. **Query Hints** for optimizer guidance

### Example Materialized View
```sql
CREATE MATERIALIZED VIEW mv_daily_performance AS
SELECT 
  journey_date,
  service_id,
  operator_id,
  COUNT(*) as total_journeys,
  SUM(CASE WHEN status = 'ON_TIME' THEN 1 ELSE 0 END) as on_time_count,
  AVG(delay_minutes) as avg_delay
FROM journeys
GROUP BY journey_date, service_id, operator_id;
```

## Backup & Recovery

### Backup Strategy
- **Type**: Full daily backups + hourly transaction logs
- **Retention**: 30 days minimum
- **Location**: Off-site redundant storage
- **RPO (Recovery Point Objective)**: 1 hour
- **RTO (Recovery Time Objective)**: 4 hours

### Recovery Procedures
1. Identify corruption point
2. Restore from latest clean backup
3. Replay transaction logs to recovery point
4. Verify data integrity
5. Resume operations

## Capacity Planning

### Current Requirements
- **Estimated Daily Records**: ~500,000 journeys
- **Storage Estimate**: 100GB per year
- **Peak Concurrent Users**: 500
- **Query Response Target**: <2 seconds

### Scalability Roadmap
- Year 1: Single instance with replication
- Year 2: Read replicas for analytics
- Year 3: Distributed architecture if needed

## Maintenance Schedule

| Task | Frequency | Duration | Impact |
|------|-----------|----------|--------|
| Index Rebuild | Weekly | 30 min | Off-peak |
| Statistics Update | Daily | 15 min | Off-peak |
| VACUUM/ANALYZE | Daily | 20 min | Off-peak |
| Full Backup | Daily | 1 hour | Off-peak |
| Integrity Check | Weekly | 45 min | Off-peak |

## Migration Plan

### From Raw Data to Production
1. **Stage 1**: Data validation and cleaning
2. **Stage 2**: Schema creation and indexing
3. **Stage 3**: ETL pipeline implementation
4. **Stage 4**: Data load and verification
5. **Stage 5**: Performance tuning
6. **Stage 6**: Production cutover

## Monitoring & Alerts

### Key Metrics to Monitor
- Query response times
- Database size growth
- Connection pool usage
- Lock wait times
- Backup success/failure
- Disk space utilization

### Alert Thresholds
- Query execution > 5 seconds: Warning
- Database size growth > 1GB/day: Alert
- Failed backup: Critical
- Disk space < 10%: Critical
