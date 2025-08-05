# MoniPark - Parking Management System Documentation

## Table of Contents
1. [System Functionality & User Interaction](#system-functionality--user-interaction)
2. [Current Interface Designs](#current-interface-designs)
3. [System Architecture](#system-architecture)
4. [Prototype Presentation](#prototype-presentation)
5. [Branding & Style Guide](#branding--style-guide)

---

## System Functionality & User Interaction

### 🎯 Core System Purpose
MoniPark is an intelligent parking management system that automates the collection, processing, and management of camera data for parking areas. The system provides real-time vehicle tracking, automated data collection from FTP servers, and comprehensive management interfaces.

### 🔧 Key Functionalities

#### **1. Automated Data Collection**
- **FTP Server Integration**: Connects to FTP servers for each parking area to fetch camera data files
- **Real-time Processing**: Processes raw camera data to extract vehicle information (plate numbers, timestamps, status)
- **Scheduled Updates**: Automatically fetches new data at configurable intervals (default: 60 minutes)
- **Incremental Processing**: Only processes new/unprocessed data to optimize performance

#### **2. Vehicle Management**
- **Entry/Exit Tracking**: Monitors vehicle APPROACHING and LEAVING events
- **Plate Recognition**: Processes license plate data from camera feeds
- **Status Management**: Handles cases where cameras miss exit events by cleaning up duplicate entries
- **Real-time Updates**: Provides live vehicle status across all parking areas

#### **3. Parking Area Management**
- **Multi-Area Support**: Manages multiple parking areas under different businesses
- **FTP Configuration**: Configurable FTP server settings per parking area
- **Capacity Monitoring**: Tracks parking capacity and utilization
- **Location Management**: Geographic location tracking for each area

#### **4. User Management & Authentication**
- **Role-based Access**: Supports admin, staff, and customer roles
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Session Management**: HTTP-only cookies for refresh tokens, localStorage for access tokens
- **Account Management**: User profile management and business account setup

#### **5. Analytics & Reporting**
- **Dashboard Analytics**: Real-time statistics and KPIs
- **Vehicle Statistics**: Total vehicles, active vehicles, daily stats
- **Revenue Tracking**: Parking fee calculations and revenue analytics
- **Historical Data**: Comprehensive record keeping for analysis

### 👥 User Interaction Flows

#### **Administrator Workflow**
1. **Login** → Access secure admin dashboard
2. **Area Management** → Configure parking areas and FTP servers
3. **Monitor Dashboard** → View real-time statistics and vehicle data
4. **User Management** → Manage staff accounts and permissions
5. **System Configuration** → Adjust FTP schedules and processing parameters

#### **Staff Workflow**
1. **Login** → Access staff dashboard with limited permissions
2. **Vehicle Monitoring** → View current vehicles in assigned areas
3. **Record Management** → Access parking records and history
4. **Area Overview** → Monitor specific parking area status

#### **Business Owner Workflow**
1. **Registration** → Create business account and configure areas
2. **FTP Setup** → Configure camera data sources for each area
3. **Monitoring** → Track parking utilization and revenue
4. **Reporting** → Access business analytics and reports

---

## Current Interface Designs

### 🎨 Design System Overview
MoniPark uses a modern, dark-themed design system with a professional aesthetic suitable for business applications.

### 🎯 Key Design Principles
- **Dark Theme**: Primary black background (#121212) for reduced eye strain
- **Professional Aesthetics**: Clean, modern interface suitable for business use
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: High contrast ratios and clear typography
- **Consistency**: Unified design language across all components

### 🖥️ Interface Components

#### **1. Navigation & Header**
- **Fixed Header**: Sticky navigation with logo and user account dropdown
- **Breadcrumb Navigation**: Clear path indication for complex workflows
- **Account Popup**: User profile management with logout functionality
- **Responsive Menu**: Collapsible navigation for mobile devices

#### **2. Dashboard Interface**
- **Statistics Cards**: Key metrics displayed in card format
- **Data Visualization**: Charts and graphs for analytics
- **Real-time Updates**: Live data refresh capabilities
- **Quick Actions**: Shortcut buttons for common tasks

#### **3. Area Management Interface**
- **Grid Layout**: Card-based area display with hover effects
- **Modal Dialogs**: FTP configuration and area setup forms
- **Status Indicators**: Visual indicators for area status and connectivity
- **Action Buttons**: Clear call-to-action buttons for management tasks

#### **4. Authentication Interfaces**
- **Login Form**: Clean, centered form with validation
- **Registration Form**: Multi-step business account setup
- **Password Recovery**: Secure password reset functionality
- **Session Management**: Automatic token refresh and logout

#### **5. Data Display Components**
- **Tables**: Sortable, filterable data tables for vehicle records
- **Pagination**: Efficient data browsing for large datasets
- **Search Functionality**: Real-time search across records
- **Export Options**: Data export capabilities for reporting

### 🎨 Visual Design Elements

#### **Color Palette**
```css
Primary Colors:
- Black: #121212 (Background)
- Gold: #E8D767 (Accent)
- Blue: #193ED8 (Primary)
- Text Light: #F5F5F7 (Primary Text)
- Text Muted: rgba(245, 245, 247, 0.6) (Secondary Text)
```

#### **Typography**
- **Primary Font**: System fonts with fallbacks
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, optimized for screens
- **Code**: Monospace for technical data

#### **Spacing & Layout**
- **Grid System**: 12-column responsive grid
- **Spacing Scale**: Consistent 4px base unit
- **Container Widths**: Max-width constraints for readability
- **Padding/Margins**: Generous whitespace for breathing room

---

## System Architecture

### 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/TS)    │◄──►│  (Node.js/      │◄──►│   (MongoDB)     │
│                 │    │   Express)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │   FTP Servers   │    │   Data Storage  │
│   (Chrome, etc) │    │  (Camera Data)  │    │   & Analytics   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 Technology Stack

#### **Frontend Layer**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router v6 with protected routes
- **UI Components**: Custom components with shadcn/ui base
- **HTTP Client**: Fetch API with custom interceptors
- **Authentication**: JWT tokens with automatic refresh

#### **Backend Layer**
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js with middleware architecture
- **Authentication**: JWT with access/refresh token pattern
- **File Processing**: FTP client for camera data collection
- **Scheduling**: Node.js setInterval for automated tasks
- **Data Processing**: CSV parsing and data transformation
- **API Design**: RESTful endpoints with proper HTTP methods
- **Error Handling**: Comprehensive error middleware

#### **Database Layer**
- **Database**: MongoDB with Mongoose ODM
- **Collections**: Users, Areas, Vehicles, Records, Businesses, FtpServers
- **Relationships**: Referenced documents with population
- **Indexing**: Optimized indexes for query performance
- **Data Validation**: Schema-level validation with Mongoose
- **Connection**: Connection pooling and error handling

#### **Infrastructure Layer**
- **Development**: Local development with hot reload
- **Environment**: Environment variable configuration
- **Security**: CORS, rate limiting, input sanitization
- **Logging**: Console logging with timestamps
- **Error Tracking**: Comprehensive error logging
- **Performance**: Optimized queries and caching strategies

### 📊 Data Flow Architecture

#### **1. Data Collection Flow**
```
FTP Server → Backend Service → Data Processing → MongoDB Storage
     ↓              ↓              ↓              ↓
Camera Data → CSV Parsing → Vehicle Records → Database
```

#### **2. User Interaction Flow**
```
User Browser → Frontend App → API Requests → Backend Service → Database
     ↓              ↓              ↓              ↓              ↓
UI Actions → State Updates → HTTP Calls → Business Logic → Data Retrieval
```

#### **3. Authentication Flow**
```
Login Request → JWT Generation → Token Storage → Protected Routes
     ↓              ↓              ↓              ↓
Credentials → Access Token → localStorage → Route Guards
```

### 🔒 Security Architecture

#### **Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: HTTP-only cookies for security
- **Role-based Access**: Admin, staff, customer permissions
- **Route Protection**: Protected routes with authentication checks
- **Token Refresh**: Automatic token renewal with interceptor

#### **Data Security**
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization and output encoding
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: API rate limiting to prevent abuse

#### **Infrastructure Security**
- **Environment Variables**: Secure configuration management
- **HTTPS**: Secure communication in production
- **Error Handling**: Secure error messages without data leakage
- **Logging**: Secure logging without sensitive data exposure

---

## Prototype Presentation

### 🚀 Live System Demo

#### **Access Information**
- **Frontend URL**: http://localhost:5173
- **Backend API**: http://localhost:1313/api
- **Development Mode**: Hot reload enabled for real-time development

#### **Demo Scenarios**

##### **Scenario 1: New Business Setup**
1. **Navigate to**: http://localhost:5173/register
2. **Create Account**: Fill in business details and credentials
3. **Configure Areas**: Set up parking areas with FTP server information
4. **Verify Setup**: Check dashboard for area configuration

##### **Scenario 2: Vehicle Monitoring**
1. **Login**: Access system with admin credentials
2. **Dashboard**: View real-time vehicle statistics
3. **Area Management**: Monitor specific parking areas
4. **Vehicle Records**: View detailed vehicle entry/exit data

##### **Scenario 3: FTP Data Processing**
1. **Backend Logs**: Monitor FTP data collection in console
2. **Scheduled Processing**: Observe automatic data fetching
3. **Data Updates**: Watch real-time data updates in frontend
4. **Error Handling**: Test error scenarios and recovery

#### **Key Features Demonstration**

##### **Real-time Dashboard**
- Live vehicle count updates
- Parking area status indicators
- Revenue and utilization metrics
- Historical data visualization

##### **Area Management**
- FTP server configuration
- Camera data integration
- Area status monitoring
- Record management

##### **User Management**
- Role-based access control
- Account management
- Session handling
- Security features

### 📱 Responsive Design Demo
- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Mobile-first design with collapsible navigation

### 🔧 Technical Demo
- **API Testing**: Use Postman or curl to test endpoints
- **Database Queries**: MongoDB Compass for data inspection
- **FTP Integration**: Test FTP server connections
- **Error Scenarios**: Test error handling and recovery

---

## Branding & Style Guide

### 🎨 Brand Identity

#### **Brand Name**: MoniPark
- **Meaning**: Monitoring + Parking = Intelligent parking monitoring
- **Pronunciation**: "Moni-Park" (short for Monitor Parking)
- **Tagline**: "Intelligent Parking Management"

#### **Brand Personality**
- **Professional**: Business-focused and reliable
- **Modern**: Contemporary technology and design
- **Efficient**: Streamlined and optimized processes
- **Secure**: Trustworthy and data-protected
- **Innovative**: Cutting-edge parking management solutions

### 🎨 Visual Identity

#### **Logo Design**
- **Primary Logo**: Text-based with custom typography
- **Icon**: Minimalist parking symbol with monitoring elements
- **Color Usage**: Gold accent on black background
- **Typography**: Modern, clean sans-serif font

#### **Color System**

##### **Primary Colors**
```css
/* Brand Colors */
--color-black: #121212;        /* Primary Background */
--color-gold: #E8D767;         /* Brand Accent */
--color-blue: #193ED8;         /* Primary Action */
--color-white: #F5F5F7;        /* Primary Text */
```

##### **Secondary Colors**
```css
/* Supporting Colors */
--color-gray-100: #1A1A1A;     /* Secondary Background */
--color-gray-200: #2A2A2A;     /* Card Background */
--color-gray-300: #3A3A3A;     /* Border Color */
--color-gray-400: #6B7280;     /* Muted Text */
```

##### **Semantic Colors**
```css
/* Status Colors */
--color-success: #10B981;      /* Success/Green */
--color-warning: #F59E0B;      /* Warning/Yellow */
--color-error: #EF4444;        /* Error/Red */
--color-info: #3B82F6;         /* Info/Blue */
```

#### **Typography System**

##### **Font Hierarchy**
```css
/* Headings */
--font-heading-1: 3rem;        /* 48px - Main titles */
--font-heading-2: 2.25rem;     /* 36px - Section titles */
--font-heading-3: 1.875rem;    /* 30px - Subsection titles */
--font-heading-4: 1.5rem;      /* 24px - Card titles */

/* Body Text */
--font-body-large: 1.125rem;   /* 18px - Large body text */
--font-body: 1rem;             /* 16px - Standard body text */
--font-body-small: 0.875rem;   /* 14px - Small text */
--font-caption: 0.75rem;       /* 12px - Captions */
```

##### **Font Weights**
```css
--font-light: 300;             /* Light weight */
--font-normal: 400;            /* Regular weight */
--font-medium: 500;            /* Medium weight */
--font-semibold: 600;          /* Semi-bold weight */
--font-bold: 700;              /* Bold weight */
```

### 🎯 Design Principles

#### **1. Clarity First**
- Clear information hierarchy
- Readable typography
- High contrast ratios
- Intuitive navigation

#### **2. Consistency**
- Unified design language
- Consistent spacing
- Standardized components
- Predictable interactions

#### **3. Efficiency**
- Streamlined workflows
- Quick access to common actions
- Minimal cognitive load
- Fast loading times

#### **4. Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements

### 🎨 Component Design System

#### **Buttons**
```css
/* Primary Button */
.btn-primary {
  background: var(--color-blue);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-blue);
  border: 1px solid var(--color-blue);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}
```

#### **Cards**
```css
/* Standard Card */
.card {
  background: var(--color-gray-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid var(--color-gray-300);
}
```

#### **Forms**
```css
/* Input Fields */
.input {
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: var(--color-white);
}
```

### 📱 Responsive Design Guidelines

#### **Breakpoints**
```css
--breakpoint-sm: 640px;        /* Small devices */
--breakpoint-md: 768px;        /* Medium devices */
--breakpoint-lg: 1024px;       /* Large devices */
--breakpoint-xl: 1280px;       /* Extra large devices */
--breakpoint-2xl: 1536px;      /* 2X large devices */
```

#### **Mobile-First Approach**
- Design for mobile devices first
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized navigation for small screens

### 🎨 Animation & Interaction

#### **Micro-interactions**
- Smooth hover effects
- Loading states with spinners
- Transition animations
- Feedback for user actions

#### **Performance Guidelines**
- 60fps animations
- Hardware acceleration where possible
- Reduced motion for accessibility
- Optimized asset loading

---

## Conclusion

MoniPark represents a comprehensive, modern parking management solution that combines automated data collection, real-time monitoring, and intuitive user interfaces. The system's architecture supports scalability, security, and maintainability while providing a professional user experience suitable for business environments.

The design system ensures consistency and accessibility across all interfaces, while the technical architecture provides robust data processing and real-time capabilities. The system is ready for production deployment with proper security measures and performance optimizations in place. 