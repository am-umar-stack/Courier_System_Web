# 🚚 A.M.U Courriers — Courier Delivery & Tracking Platform

A modern, fast, and secure web application for courier management tailored for delivery services across 50+ cities in Pakistan. The project combines a highly interactive Client Single Page Application (SPA) with a robust backend Prisma/MySQL database design.

---

## 🌟 Key Features

### 👤 Customer Experience
* **Live Parcel Tracking**: Instantly search parcels via 6-digit tracking codes with a beautiful visual timeline (Order Placed → Picked Up → In Transit → Delivered).
* **Easy Booking Form**: Interactive booking interface with auto-calculated rates based on package weight.
* **Customer Feedback Center**: Star-rating reviews with real-time feedback submissions.

### 🛡️ Admin Panel
* **Package Management**: Register packages, update statuses on the fly, and delete records.
* **Booking Request Conversion**: Review pending customer bookings and convert them into trackable packages with one click.
* **Review Moderation**: Full list of user feedback with administrative deletion capabilities.
* **Statistic Dashboards**: Quick-glance metrics (Total Packages, Pending, In Transit, Delivered, and Active Bookings).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, Lucide React (Icons) |
| **State & Persistence** | Client-side React Hooks, `localStorage` DB layer |
| **Database ORM** | Prisma |
| **Database Engine** | MySQL 8 |

---

## 🚀 Quick Start

To run the Client SPA web application locally:

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Start the Development Server
Run the Vite development server locally:
```bash
npm run dev
```

### 3. Open in Browser
Open your browser and navigate to:
```
http://localhost:5173/
```

---

## 🔑 Admin Credentials

To access the administrative dashboards, navigate to **Sign In** (at the bottom-left of the sidebar) and use the following pre-configured credentials:

* **Email**: `admin@amu.com`
* **Password**: `password123`
