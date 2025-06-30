# AdForge Pro - Facebook Ads Analytics Dashboard

A comprehensive AI-powered Facebook ads analytics and performance tracking platform built with Next.js, Supabase, and OpenAI.

## Features

### 🚀 Core Features
- **Dashboard Overview**: Real-time KPI cards showing spend, ROAS, CTR, and CPC with trend analysis
- **Product Management**: Add and manage products across categories (E-Commerce, E-com Accelerator, WMA, Go Health)
- **CSV Data Upload**: Import Facebook ads data with intelligent parsing and naming convention analysis
- **AI-Powered Analysis**: Automatic website analysis and competitor research using OpenAI
- **Weekly/Monthly/Quarterly Reports**: Comprehensive performance tracking with filterable date ranges
- **Designer Performance Tracking**: Monitor individual designer performance and ad creation metrics

### 👥 User Roles
- **Admin**: Full access to product creation, CSV uploads, user management
- **Regular User**: View data, analyze performance, add product information

### 📊 Analytics Features
- **Top Performing Ads**: ROAS-based performance ranking
- **Scaled Ads Tracking**: Ads spending >$1000/week
- **Working Ads Monitoring**: Ads spending $100-$1000/week  
- **Creative Type Analysis**: IMG vs VIDEO performance comparison
- **Creative Hub Detection**: Automatic identification of Creative Hub ads
- **Naming Convention Parsing**: Intelligent extraction of designer, format, aspect ratio, etc.

### 🤖 AI Integration
- **Website Analysis**: Extract product info, target audience, value propositions
- **Competitor Research**: Automatically find and analyze competitors
- **Product Insights**: AI-generated marketing angles and creative themes

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: OpenAI GPT-4 for analysis and research
- **File Processing**: PapaParse for CSV handling
- **UI Components**: Headless UI, Heroicons, React Hook Form
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ads-analysis-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.local.example` to `.env.local` and fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   Run the SQL script in your Supabase SQL editor:
   ```sql
   -- Execute the contents of sql/create_tables.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Core Tables
- **users**: User profiles with role-based access
- **categories**: Product categories (E-Commerce, WMA, etc.)
- **products**: Product information with AI analysis data
- **designers**: Designer profiles with performance tracking
- **ads**: Facebook ads data with parsed naming conventions

## CSV Upload Format

Your CSV files should include these columns:
- `Ad Name`: Full ad name with naming convention
- `Adset Name`: Adset identifier
- `Creative Type`: SHARE/VIDEO (auto-detected if empty)
- `Spend In USD`: Ad spend amount
- `Impressions`: Number of impressions
- `First Ad Spend Date`: Start date
- `Last Ad Spend Date`: End date  
- `Days ad spending`: Duration in days

### Naming Convention Example
```
BI_F-WL1932_2025_AL_W03-4_FB_982_ER_IMG_1x1_New_420_HE-3007_BC-508_CTA-1384_P-GLP1_M-TR_E-BADGE3_C-CompetitorAds_S-Limited_S-3_Red_T-4_V01
```

**Parsed Elements:**
- `BI`: Product code (Bioma)
- `ER`: Designer code
- `1x1`: Aspect ratio
- `IMG/VIDEO`: Format type
- `New/Opti`: Ad type (New/Optimization)
- `_chub_`: Creative Hub indicator

## API Routes

### `/api/analyze-product`
POST endpoint for AI-powered product website analysis
- Analyzes website content
- Finds competitors
- Generates marketing insights

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   └── modals/          # Modal components
├── lib/                 # Utility libraries
│   ├── supabase.ts     # Supabase client
│   └── openai.ts       # OpenAI client
├── types/              # TypeScript type definitions
└── sql/                # Database schema
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@adforge.pro or join our Slack channel. 