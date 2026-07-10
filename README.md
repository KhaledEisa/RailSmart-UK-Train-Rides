# 🚂 RailSmart - UK Railway Intelligence Platform

> An intelligent railway booking assistant that analyzes historical journey data to predict train crowding, send price drop alerts, recommend optimal travel times, and automate delay-based refund requests for UK rail passengers.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-lightgrey)

---

## 📋 Table of Contents

- [About](#about)
- [Problem Statement](#problem-statement)
- [Project Aim & Objectives](#project-aim--objectives)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Dataset](#dataset)
- [Installation](#installation)
- [Usage](#usage)
- [Analytics & Insights](#analytics--insights)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

---

## 🎯 About

**RailSmart** is a data-driven mobile and web application designed to revolutionize the UK railway passenger experience. By leveraging advanced data analytics, machine learning, and real-time insights, RailSmart helps millions of rail passengers make smarter travel decisions, save money, and avoid delays.

The platform analyzes over **31,000+ historical railway journeys** to provide personalized recommendations, predictive alerts, and automated refund assistance - transforming how people interact with the UK railway system.

### Why RailSmart?

- 🎫 **Save Money**: Get alerted when ticket prices drop or when advance tickets are released
- ⏰ **Save Time**: Know which trains are likely to be delayed before you book
- 🚆 **Travel Comfortably**: Avoid overcrowded trains with crowding predictions
- 💰 **Automatic Refunds**: Automatically detect when you're eligible for delay compensation
- 📊 **Smart Insights**: Make data-driven decisions about when and how to travel

---

## 🔍 Problem Statement

UK rail passengers face multiple challenges:

1. **Unpredictable Pricing**: Train ticket prices fluctuate significantly, and passengers often overpay by missing cheaper advance tickets
2. **Frequent Delays**: Signal failures, weather, and technical issues cause regular delays across the network
3. **Complex Refund Process**: Most passengers entitled to compensation never claim it. In this dataset, **73.2% of entitled passengers did not claim**, leaving £133,568 unclaimed across four months
4. **Overcrowding**: Peak-time trains are often overcrowded, leading to uncomfortable journeys
5. **Information Gap**: Passengers lack historical data to make informed decisions about routes and travel times
6. **Route Optimization**: Limited guidance on which routes or times offer the best value and reliability

**Current solutions (Trainline, National Rail) only show schedules and current prices - they don't provide predictive insights or intelligent recommendations.**

---

## 🎯 Project Aim & Objectives

### **Primary Aim**

To develop an intelligent, data-driven platform that empowers UK railway passengers to make optimal travel decisions through predictive analytics, automated alerts, and personalized recommendations.

### **Objectives**

#### 1. **Data Analytics & Insights**
- Analyze 31,000+ historical railway journeys to identify patterns
- Develop predictive models for delays, pricing, and crowding
- Create interactive dashboards visualizing route performance
- Generate actionable insights for route optimization

#### 2. **Price Intelligence**
- Build price prediction models to forecast ticket price trends
- Calculate optimal booking windows (how many days in advance)
- Identify routes with highest savings potential
- Send automated price drop alerts to users

#### 3. **Delay Prediction & Management**
- Develop ML models to predict delay probability by route and time
- Analyze delay root causes (signal failures, weather, etc.)
- Recommend alternative routes during high-risk periods
- Calculate on-time performance scores for each route

#### 4. **Refund Automation**
- Automatically detect journeys eligible for compensation
- Calculate refund amounts based on delay duration
- Streamline the refund request process
- Track and notify users of refund status

#### 5. **User Experience**
- Design intuitive Android mobile application
- Create responsive web dashboard for analytics
- Implement real-time push notifications
- Provide personalized route recommendations

#### 6. **Technical Excellence**
- Build scalable database architecture (PostgreSQL/Supabase)
- Develop RESTful API for data access
- Implement secure user authentication
- Ensure 99.9% uptime and <2 second response times

---

## ✨ Key Features

### 📱 Mobile App Features

#### Smart Search & Booking
- Intelligent route search with multiple filtering options
- Real-time availability and pricing
- Alternative route suggestions
- Multi-criteria sorting (price, time, delays, crowding)

#### Price Alerts & Notifications
- 🔔 Price drop alerts for saved routes
- 📉 Advance ticket release notifications
- ⚡ Flash deal alerts
- 📊 Price trend visualizations

#### Delay Intelligence
- 🚨 Real-time delay predictions
- 📍 Route reliability scores
- ⏱️ Best time-to-travel recommendations
- 🔄 Alternative route suggestions during disruptions

#### Refund Assistant
- 💰 Automatic delay compensation detection
- 📝 One-click refund requests
- 📈 Refund tracking and history
- 🎯 Estimated refund amount calculator

#### Personalization
- 🎫 Saved routes and favorites
- 🕐 Travel history tracking
- 📊 Personal travel analytics
- 🎯 AI-powered recommendations

#### Crowding Predictions
- 📊 Train capacity forecasts
- 🚆 Seat availability predictions
- ⏰ Best departure time recommendations
- 📈 Historical crowding patterns

### 💻 Web Dashboard Features

#### Analytics Dashboard
- 📊 Interactive route performance visualizations
- 📈 Price trend analysis charts
- 🗺️ Network-wide delay heatmaps
- 📉 Revenue and booking statistics

#### Advanced Insights
- 🎯 Route profitability analysis
- 📊 Customer behavior patterns
- 🔍 Deep-dive route comparisons
- 📈 Temporal trend analysis

#### Reporting
- 📄 Automated report generation
- 📧 Scheduled email reports
- 📊 Custom dashboard creation
- 📥 Data export capabilities

---

## 🛠️ Technology Stack

> Items marked **(planned)** are not yet built. Everything else ships in this repository.

### **Frontend**
- **Web**: React 18 + Vite + Tailwind CSS (`dashboard-web/`)
- **3D**: three.js via @react-three/fiber and drei — interactive Intercity 125 model
- **Mobile**: React Native / Expo *(in development)*
- **Charts**: Recharts, Plotly

### **Backend**
- **Current**: no live API. All three role views read pre-exported JSON in
  `dashboard-web/public/data/`, generated from the cleaned CSV by `scripts/export_*.py`.
- **API**: Python FastAPI **(planned)**
- **Database**: PostgreSQL via Supabase **(planned)**
- **Authentication**: Supabase Auth **(planned)**
- **Hosting**: Vercel **(planned)**

### **Data Analytics**
- **Language**: Python 3.10+
- **Libraries**:
  - Pandas, NumPy (data manipulation)
  - Scikit-learn — RandomForest regression and classification
  - statsmodels — SARIMA time-series forecasting
  - Matplotlib, Seaborn, Plotly (visualization)
  - Ultralytics YOLOv8 (platform crowd counting)

### **Infrastructure**
- **Database**: Supabase (PostgreSQL) / AWS RDS
- **Notifications**: Firebase Cloud Messaging
- **Storage**: Supabase Storage / AWS S3
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Google Analytics

### **Development Tools**
- **Version Control**: Git, GitHub
- **API Testing**: Postman, Thunder Client
- **Database Management**: pgAdmin, DBeaver
- **Design**: Figma, Adobe XD

---

## 📊 Dataset

### **Source**: UK Railway Journey Data (2024)

### **Dataset Statistics**
- **Total Records**: 31,653 journeys
- **Journey Date Range**: 1 January 2024 – 30 April 2024 (121 days)
- **Purchase Date Range**: 8 December 2023 – 30 April 2024
- **Routes Covered**: 65 unique station pairs (12 departure stations, 32 destinations)
- **Features**: 19 raw columns → 42 after feature engineering

### **Data Dictionary**

| Column | Description | Type |
|--------|-------------|------|
| Transaction ID | Unique identifier for each booking | String |
| Date of Purchase | When the ticket was purchased | Date |
| Time of Purchase | Time of booking | Time |
| Purchase Type | Online, Station, or other | Categorical |
| Payment Method | Credit Card, Contactless, etc. | Categorical |
| Railcard | Type of railcard (Adult, Senior, Disabled, No Railcard) | Categorical |
| Ticket Class | Standard or First Class | Categorical |
| Ticket Type | Advance, Off-Peak, Anytime | Categorical |
| Price | Ticket price in GBP (£) | Float |
| Departure Station | Origin station | String |
| Arrival Destination | Destination station | String |
| Date of Journey | Actual travel date | Date |
| Departure Time | Scheduled departure time | Time |
| Arrival Time | Scheduled arrival time | Time |
| Actual Arrival Time | Real arrival time | Time |
| Journey Status | On Time, Delayed, Cancelled | Categorical |
| Reason for Delay | Signal Failure, Weather, etc. | String |
| Refund Request | Yes/No | Boolean |

### **Key Insights from Data**

All figures below are reproduced by `data_analysis_and_cleaning.ipynb` against
`cleaned_data/railway_cleaned.csv`.

- **Punctuality**: 86.8% on time, 7.2% delayed, 5.9% cancelled — **13.2% disrupted**
- **Top Delay Cause**: Weather (32.9% of disruptions), then signal failure (23.3%),
  staffing (19.4%), technical issues (16.9%), traffic (7.5%)
- **Average Ticket Price**: £23.44 (median £11.00 — a thin First Class tail pulls the mean up)
- **Advance Savings**: Advance tickets average £17.61 vs £39.20 for Anytime — a saving of
  £21.59, or **55%**
- **Busiest Route by Volume**: Manchester Piccadilly → Liverpool Lime Street (4,628 journeys)
- **Highest Revenue Route**: London Kings Cross → York (£183,193)
- **Worst Route**: Edinburgh Waverley → London Kings Cross, 0% on time across 51 journeys
- **Unclaimed Compensation**: of the 4,172 passengers entitled to a refund, only **26.8%
  claimed** — leaving **£133,568** unclaimed, 18% of total revenue

---

## 🚀 Installation

### Prerequisites
```
- Python 3.10+   (analysis notebook)
- Node.js 18+    (web dashboard)
- Git
```

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RailSmart-UK-Train-Rides.git
cd RailSmart-UK-Train-Rides
```

### 2. Run the Analysis
```bash
pip install pandas numpy scikit-learn statsmodels matplotlib seaborn plotly jupyter

# Runs end-to-end: cleaning, EDA, models, forecasting, and rewrites
# cleaned_data/railway_cleaned.csv
jupyter notebook data_analysis_and_cleaning.ipynb
```

### 3. Run the Web Dashboard
```bash
cd dashboard-web
npm install
npm run dev          # http://localhost:5173
```

No login is required — the three role views (Data Engineer, Passenger, Station Manager)
are selected from the switcher at the top of the page.

### 4. Regenerate the Dashboard Data

Run these after any change to the cleaned dataset. Each writes one JSON file into
`dashboard-web/public/data/`.

```bash
python scripts/export_dashboard_data.py   # -> dashboard_data.json
python scripts/export_passenger_data.py   # -> passenger_data.json
python scripts/export_manager_data.py     # -> manager_data.json
python scripts/export_tableau_extract.py  # -> cleaned_data/tableau/*.csv
python scripts/sync_mobile_data.py        # copy the JSON into the Expo app
```

### 5. Verify Everything Agrees

The same figures are published in six places (notebook, three dashboard JSONs, Tableau
extracts, mobile app). This reconciles all of them against the cleaned CSV and exits
non-zero on any disagreement:

```bash
python scripts/verify_consistency.py
```

### 6. Run the Mobile App *(Expo)*
```bash
cd mobile
npx expo start           # scan the QR with Expo Go — phone on the same Wi-Fi
npx expo start --tunnel  # if the phone is on a different network
```

### 7. Regenerate the AI Crowd-Counting Demo *(optional)*
```bash
pip install ultralytics
python scripts/make_person_count_demo.py  # -> public/demo/station_count.mp4
```

---

## 📖 Usage

### The analysis notebook

`data_analysis_and_cleaning.ipynb` is the single source of truth. It runs top to bottom
with no manual steps and covers:

| Section | Contents |
|---------|----------|
| 1–7   | Load, explore, missing values, duplicates, outliers, dtypes |
| 8     | Feature engineering (19 raw → 42 columns) |
| 9     | Exploratory analysis |
| 10    | Strategic read-outs: refunds, route reliability, urgency tax, **unclaimed compensation** |
| 11    | Additional visualisations |
| 12    | Export cleaned dataset |
| 13    | Prototype models: fare, delay risk, cancellation, claim propensity |
| 14    | Forecasting: SARIMA vs naive benchmarks, 30-day projection, class mix |

### SQL

`sql/Cleaning & Analysis.sql` reproduces the cleaning and the core aggregate queries
against a relational copy of the raw table.

### Web dashboard

Three role-based views over the same cleaned dataset:

- **Data Engineer** — KPI cards, regional revenue, seating class mix, sales trend
- **Passenger** — journey planner, fares and offers, leave-by calculator, station crowding
- **Station Manager** — fleet status, maintenance queue, delay watch, delay analytics

---

## 📈 Analytics & Insights

### Key Performance Indicators (KPIs)

#### Delay Analysis
- **Overall On-Time Rate**: 86.8% (7.2% delayed, 5.9% cancelled)
- **Worst Performing Routes**: 4 routes with <50% on-time reliability, out of 48 routes
  carrying at least 30 journeys
- **Peak Delay Hour**: the 08:00 departure, at a 33.4% delay rate — roughly 4.6× the
  network average
- **Most Common Delay Cause**: Weather (32.9% of disruptions)

#### Pricing Intelligence
- **Average Advance Savings**: £21.59 per ticket (£17.61 Advance vs £39.20 Anytime, 55%)
- **Booking Lead Time**: median **1 day**; 89% of tickets bought within 2 days of travel;
  no journey in this dataset was booked more than 28 days ahead
- **Urgency Tax**: last-minute buyers (≤2 days) pay 38.3% more on average — though this
  compares 28,203 urgent bookings against only 3,450 planned ones
- **Fare Range**: £1 to £267 (99th percentile £151)

#### Revenue Analysis
- **Total Dataset Revenue**: £741,921
- **Highest Revenue Route**: London Kings Cross → York (£183,193)
- **Highest Total Revenue by Segment**: Advance Standard (£242,388 across 15,797 journeys)
- **Highest Revenue per Ticket**: Anytime First Class (£77.23 average fare)

#### Customer Behavior
- **Online Booking**: 58.5% of all purchases (41.5% at the station)
- **Payment Mix**: Credit Card 60.5%, Contactless 34.2%, Debit Card 5.3%
- **Railcard Usage**: 33.9% of passengers; holders pay 42.9% less on average
- **Refund Claim Rate**: only 26.8% of entitled passengers ever claim

### Sample Insights

These run against a table loaded from `cleaned_data/railway_cleaned.csv`.

```sql
-- Most reliable routes for commuters (min. 30 journeys so a handful of trips
-- cannot put a route at the top of the table)
SELECT   route,
         COUNT(*)                                                   AS journeys,
         ROUND(100.0 * AVG(CASE WHEN journey_status = 'On Time'
                                THEN 1 ELSE 0 END), 1)              AS on_time_pct
FROM     railway
GROUP BY route
HAVING   COUNT(*) >= 30
ORDER BY on_time_pct DESC
LIMIT    10;

-- Compensation nobody claimed: entitled passengers who never filed
SELECT   journey_status,
         COUNT(*)                                                   AS entitled,
         SUM(CASE WHEN refund_request = 'No' THEN 1 ELSE 0 END)     AS never_claimed,
         ROUND(SUM(CASE WHEN refund_request = 'No'
                        THEN price ELSE 0 END), 2)                  AS unclaimed_value
FROM     railway
WHERE    journey_status <> 'On Time'
GROUP BY journey_status;
```

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Data collection and cleaning
- [x] Database schema design
- [x] Initial data analysis
- [x] Core analytics queries

### Phase 2: Analytics & ML ✅ (Completed)
- [x] Exploratory data analysis
- [x] Delay prediction model (ROC AUC 0.98, recall 0.66)
- [x] Price prediction model (MAE £2.75, R² 0.96)
- [x] Claim propensity model (ROC AUC 0.86, recall 0.74)
- [x] Time-series forecasting (SARIMA, benchmarked against naive baselines)
- [x] Crowding estimation via YOLOv8 person counting
- [x] Interactive web dashboards (3 role views)
- [ ] Tableau dashboard
- [ ] Power BI report

### Phase 3: Backend Development 📅 (Planned)
- [ ] RESTful API development
- [ ] Database optimization
- [ ] Authentication system
- [ ] Notification service
- [ ] API documentation

### Phase 4: Frontend Development 📅 (Planned)
- [ ] Web dashboard UI/UX
- [ ] Mobile app design
- [ ] User authentication flow
- [ ] Real-time notifications
- [ ] Offline functionality

### Phase 5: Advanced Features 🔮 (Future)
- [ ] AI chatbot for customer support
- [ ] Integration with live train APIs
- [ ] Multi-language support
- [ ] Carbon footprint calculator
- [ ] Social sharing features
- [ ] Group booking coordination

### Phase 6: Launch & Scale 🚀 (Future)
- [ ] Beta testing with users
- [ ] Performance optimization
- [ ] Security audit
- [ ] Play Store deployment
- [ ] Marketing and user acquisition

---

## 📅 Project Timeline

### 3-Month Development Timeline

| Phase Name | Week | Focus of the Phase | Deliverables | Team Members |
|------------|------|-------------------|--------------|--------------|
| **Phase 1: Data Model & Data Understanding** | Week 1 | Project scope definition, data source identification, initial data exploration, data dictionary creation | Data model design, Project plan | All |
| **Phase 2: Data Cleaning & Preprocessing** | Week 2-3 | Clean and preprocess data, handle missing values, outlier detection, data type conversions, data validation | Cleaned dataset ready for analysis, Data preprocessing notebook | All |
| **Phase 3: Exploratory Data Analysis (EDA)** | Week 4-5 | Statistical analysis, pattern identification, correlation analysis, visualization of key metrics | EDA insights and visualizations | All |
| **Phase 4: Analysis Questions Phase** | Week 6-7 | Determine all possible analysis questions from the dataset, perform deep analysis, answer business questions | Set of analysis questions with answers, Analysis documentation | All |
| **Phase 5: Feature Engineering** | Week 8 | Create derived features, route analysis, delay pattern analysis, price trend analysis, prepare data for ML | Feature engineering notebook | All |
| **Phase 6: Forecasting Questions Phase** | Week 9-10 | Predict number of rides for next month, forecast revenue for each day, predict demand on different ticket classes, build and validate ML models | Forecasting models, Visualization plots answering forecasting questions | All |
| **Phase 7: Visualization Dashboard Development** | Week 11 | Build Tableau visualization dashboard, create interactive charts, design user-friendly interface | Tableau dashboard visualizing all analysis and forecasting results | All |
| **Phase 8: Final Presentation & Documentation** | Week 12 | Prepare final report and presentation, document all findings, create comprehensive project summary, code documentation | Final report, Project presentation, Complete documentation | All |

### Tools & Technologies by Phase

- **Weeks 1-3**: SQL, Python (pandas, Matplotlib)
- **Weeks 4-7**: SQL, Python (pandas, Matplotlib, Seaborn)
- **Weeks 8-10**: Python (scikit-learn, statsmodels, pandas, Matplotlib)
- **Weeks 11-12**: Tableau, SQL, Python (pandas, Matplotlib)

### Timeline Overview

- **Month 1 (Weeks 1-4)**: Data Foundation, Cleaning & Initial Analysis
- **Month 2 (Weeks 5-8)**: Deep Analysis & Feature Engineering
- **Month 3 (Weeks 9-12)**: Forecasting, Dashboard & Final Delivery

### Key Deliverables

1. ✅ **Cleaned Dataset** - Preprocessed and ready for analysis
2. ✅ **Data Preprocessing Notebook** - Jupyter notebook with all cleaning steps
3. 📊 **Analysis Questions & Answers** - Comprehensive dataset analysis
4. 🔮 **Forecasting Models** - Ride predictions, revenue forecasts, demand predictions
5. 📈 **Tableau Dashboard** - Interactive visualization dashboard
6. 📄 **Final Report & Presentation** - Complete project documentation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow PEP 8 for Python code
- Write unit tests for new features
- Update documentation as needed
- Use meaningful commit messages

---

## 👥 Authors

- **Khaled Eissa** - *Data Analyst & Developer*
- **Elsayed Elgohary** - *Data Analyst & Developer*
- **Rana Yasser** - *Data Analyst & Developer*
- **Rahma Nasser** - *Data Analyst & Developer*
- **Ahmed Shaaban** - *Data Analyst & Developer*

### Acknowledgments
- UK Railway dataset providers
- Open-source community
- YAT Program mentors and colleagues

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/yourusername/RailSmart-UK-Train-Rides/issues)
- **Email**: support@railsmart.app
- **Documentation**: [Wiki](https://github.com/yourusername/RailSmart-UK-Train-Rides/wiki)

---

## 🙏 Acknowledgments

Special thanks to:
- The data science community for open-source tools
- UK railway passengers who provided feedback
- Beta testers and early adopters
- YAT Program for project guidance

---

## 📚 References & Resources

- [UK Railway Industry Documentation](https://www.nationalrail.co.uk/)
- [Transport API Documentation](https://www.transportapi.com/)
- [Data Science Best Practices](https://github.com/datasciencemasters)
- [statsmodels — SARIMAX](https://www.statsmodels.org/stable/generated/statsmodels.tsa.statespace.sarimax.SARIMAX.html)
- [Ultralytics YOLOv8](https://docs.ultralytics.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

<div align="center">

**Made with ❤️ for UK Rail Passengers**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/RailSmart-UK-Train-Rides?style=social)](https://github.com/yourusername/RailSmart-UK-Train-Rides/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/RailSmart-UK-Train-Rides?style=social)](https://github.com/yourusername/RailSmart-UK-Train-Rides/network/members)

</div>
