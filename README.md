# 🥛 ShreeLalji Dairy - Automated Data Pipeline

An intelligent data pipeline system that extracts structured billing information from uploaded images and automatically stores it in Google Sheets, providing real-time analytics and customer insights.

## 🌟 Features

### 📸 Image Processing & OCR

- Upload multiple images of handwritten or printed bills
- AI-powered OCR using Google Gemini 2.0 Flash
- Extract structured data from dairy sales sheets
- Image viewer with zoom, rotate, and pan controls

### 💾 Automated Data Storage

- **Daily Bills Sheet**: Every bill automatically saved with complete details
- **Master Customer Sheet**: Intelligent customer tracking and aggregation
- Automatic customer identification by phone number
- Purchase history tracking in JSON format
- Real-time data synchronization with Google Sheets

### 📊 Analytics Dashboard

- **Real-time Metrics**: Total customers, sales, new customers, avg order value
- **Sales Trends**: Last 6 months sales and revenue visualization
- **Top Products**: Best-selling products with revenue breakdown
- **Customer Insights**: Active, new, and inactive customer distribution
- **Revenue Analysis**: Category-wise revenue breakdown
- **Top Customers**: Highest spending customers ranking
- Chart and Grid view modes for data visualization

### 🔄 Smart Data Management

- Phone number as primary unique identifier
- Automatic date normalization (DD-MM-YYYY)
- Purchase history aggregation per customer
- Deduplication and data consistency checks

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Image     │────▶│  Gemini OCR  │────▶│   Structured   │
│   Upload    │     │   API        │     │      Data      │
└─────────────┘     └──────────────┘     └────────────────┘
                                                   │
                                                   ▼
                                         ┌────────────────┐
                                         │  Next.js API   │
                                         │    Routes      │
                                         └────────────────┘
                                                   │
                            ┌──────────────────────┼──────────────────────┐
                            ▼                      ▼                      ▼
                    ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
                    │ Daily Bills  │     │   Master     │      │  Dashboard   │
                    │    Sheet     │     │  Customers   │      │   Metrics    │
                    └──────────────┘     └──────────────┘      └──────────────┘
                            │                     │                      │
                            └─────────────────────┴──────────────────────┘
                                                   │
                                                   ▼
                                         ┌────────────────┐
                                         │ Google Sheets  │
                                         │      API       │
                                         └────────────────┘
```

## 📋 Data Schemas

### Daily Bills Sheet

| Column         | Description              | Example                 |
| -------------- | ------------------------ | ----------------------- |
| Date           | Transaction date         | 24-11-2025              |
| Bill Number    | Unique bill ID           | B001                    |
| Customer Name  | Shop/customer name       | Arjun Grocery Store     |
| Phone Number   | Contact number           | 9876543210              |
| Products       | Comma-separated products | Milk, Curd, Paneer      |
| Quantity       | Product quantities       | 10, 5, 2                |
| Price          | Unit/total price         | 500                     |
| Total Amount   | Total bill amount        | 1250                    |
| Payment Method | Cash/UPI/Card            | Cash                    |
| Notes          | Additional notes         | Delivered by Ram        |
| Image Source   | Upload source            | OCR Upload              |
| Timestamp      | ISO timestamp            | 2025-11-24T10:30:00Z    |
| Shift          | Morning/Evening          | Morning                 |
| Address        | Delivery address         | Shop No. 5, Market Road |

### Master Customer Sheet

| Column               | Description              | Example                                                       |
| -------------------- | ------------------------ | ------------------------------------------------------------- |
| Customer Name        | Primary customer name    | Arjun Grocery Store                                           |
| Phone Number         | Unique identifier        | 9876543210                                                    |
| Email                | Email address (optional) | arjun@example.com                                             |
| Address              | Customer address         | Shop No. 5, Market Road                                       |
| Total Purchase Count | Number of purchases      | 156                                                           |
| Total Amount Spent   | Lifetime value           | 78000                                                         |
| Last Purchase Date   | Most recent purchase     | 24-11-2025                                                    |
| Purchase History     | JSON array of purchases  | [{"date":"24-11-2025","products":"Milk","totalAmount":"500"}] |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Cloud Platform account
- Google Sheets API enabled
- Gemini API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/ShreeLalji-Dairy.git
   cd ShreeLalji-Dairy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Google Sheets API**

   Follow the detailed guide in [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)

   Quick steps:

   - Create a Google Cloud Project
   - Enable Google Sheets API
   - Create a Service Account
   - Download JSON credentials
   - Create a Google Sheet
   - Share it with the service account

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add:

   ```env
   GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
   GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
   GEMINI_API=your-gemini-api-key
   ```

5. **Initialize Google Sheets**

   ```bash
   npm run dev

   # In another terminal or browser console:
   curl -X POST http://localhost:3000/api/sheets/init
   ```

6. **Open the application**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### 1. Upload and Process Images

1. Click "Choose File" to upload bill images
2. Use zoom, rotate, and pan controls to adjust the view
3. Click "Process Image" to extract data using OCR
4. Review and edit the extracted data in the right panel

### 2. Save to Google Sheets

1. After OCR extraction, verify the data
2. Click "💾 Save to Sheets" button
3. Data is automatically saved to both:
   - Daily Bills sheet (new row for each bill)
   - Master Customers sheet (new customer or updated existing)

### 3. View Analytics

1. Click "📊 View Dashboard"
2. Toggle between Chart and Grid views
3. Click "🔄 Refresh" to update with latest data
4. View metrics, trends, and customer insights

### 4. Export Data

- Click "Export CSV" to download the current bill data
- Access Google Sheets directly for advanced analysis
- Use purchase history JSON for custom reports

## 🔧 API Endpoints

### POST `/api/ocr`

Extract structured data from bill images using Gemini AI.

**Request:**

```json
{
  "imageData": "base64-encoded-image-data"
}
```

**Response:**

```json
{
  "top": {
    "date": "24-11-2025",
    "balPkt": "100",
    "totalPkt": "150",
    "newPkt": "50",
    "shift": "Morning"
  },
  "items": [...]
}
```

### POST `/api/bills/save`

Save a bill to Google Sheets and update customer records.

**Request:**

```json
{
  "customerName": "Arjun Grocery Store",
  "phoneNumber": "9876543210",
  "totalAmount": "1250",
  "products": "Milk, Curd",
  "quantity": "10, 5",
  ...
}
```

### GET `/api/dashboard/metrics`

Fetch real-time dashboard analytics from Google Sheets.

**Response:**

```json
{
  "totalCustomers": 384,
  "totalSales": 126000,
  "newCustomers": 48,
  "avgOrderValue": 325,
  "salesTrend": [...],
  "topProducts": [...],
  "topCustomers": [...]
}
```

### POST `/api/sheets/init`

Initialize Google Sheets with proper headers and structure.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Backend**: Next.js API Routes
- **Database**: Google Sheets (via Google Sheets API v4)
- **OCR**: Google Gemini 2.0 Flash
- **Authentication**: Service Account (Google Cloud)

## 📁 Project Structure

```
ShreeLalji-Dairy/
├── app/
│   ├── api/
│   │   ├── ocr/route.ts              # OCR extraction endpoint
│   │   ├── bills/save/route.ts       # Save bills endpoint
│   │   ├── dashboard/metrics/route.ts # Dashboard data endpoint
│   │   └── sheets/init/route.ts      # Initialize sheets
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                       # Main application page
├── components/
│   ├── Dashboard.tsx                  # Analytics dashboard
│   ├── ImageViewer.tsx               # Image upload & viewer
│   └── RightPanel.tsx                # Data extraction panel
├── lib/
│   ├── types.ts                      # TypeScript interfaces
│   └── googleSheets.ts               # Google Sheets utilities
├── public/
├── .env.example                       # Environment variables template
├── GOOGLE_SHEETS_SETUP.md            # Detailed setup guide
├── package.json
└── README.md
```

## 🔐 Security Considerations

- ✅ Service account credentials stored in environment variables
- ✅ `.env.local` excluded from version control
- ✅ API routes protected with error handling
- ✅ Input validation on all endpoints
- ✅ Minimal required permissions (Sheets Editor only)
- ✅ No client-side credential exposure

## 🐛 Troubleshooting

### Dashboard shows "Loading..." forever

- Check browser console for errors
- Verify Google Sheets API is enabled
- Ensure service account has Editor access to the sheet

### "GOOGLE_SHEETS_CREDENTIALS not found" error

- Confirm `.env.local` exists in project root
- Restart development server after adding variables

### OCR extraction fails

- Verify GEMINI_API key is valid
- Check image format (JPEG/PNG supported)
- Ensure image is clear and readable

### Customer not updating correctly

- Phone number is the unique identifier
- Check phone number format consistency
- View Master Customers sheet for verification

## 📈 Performance Optimization

- Server-side data processing
- Efficient Google Sheets batch operations
- Client-side caching for dashboard data
- Lazy loading of charts and components
- Optimized image handling

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Deepakbro** - Initial work

## 🙏 Acknowledgments

- Google Gemini AI for OCR capabilities
- Google Sheets API for data storage
- Recharts for beautiful visualizations
- Next.js team for the amazing framework

---

**Built with ❤️ for ShreeLalji Dairy**
