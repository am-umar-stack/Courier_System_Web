# 📊 A.M.U Courriers — Software Engineering Diagrams (BS Level)

This document contains the complete set of standard software engineering diagrams for the **A.M.U Courriers** platform. These models detail the system requirements, entities, behavioral interactions, state lifecycles, data flows, and development methodology, meeting academic expectations for a Bachelor of Science (BS) in Software Engineering.

All diagrams are rendered using standard **Mermaid** notation, making them fully viewable and editable inside standard Markdown viewers, GitHub, or VS Code.

---

## 📅 Table of Diagrams
1. [Use Case Diagram](#1-use-case-diagram)
2. [Class Diagram](#2-class-diagram)
3. [Sequence Diagram](#3-sequence-diagram)
4. [State Machine Diagram](#4-state-machine-diagram)
5. [Data Flow Diagram (DFD Level 1)](#5-data-flow-diagram-dfd-level-1)
6. [Waterfall Model Diagram](#6-waterfall-model-diagram)
7. [Spiral Model Diagram](#7-spiral-model-diagram)
8. [Scrum Process Diagram](#8-scrum-process-diagram)
9. [Rational Iteration Diagram (RUP)](#9-rational-iteration-diagram-rup)

---

## 1. Use Case Diagram
The **Use Case Diagram** defines the boundary of the A.M.U Courriers system and details how various actors (Customer, Admin, Driver, and Dispatcher) interact with different functional modules.

```mermaid
graph TD
    %% Actors
    subgraph Actors
        Customer((Customer))
        Admin((Admin))
        Driver((Driver))
        Dispatcher((Dispatcher))
    end

    %% System Boundary
    subgraph A.M.U Courriers System Boundary
        UC1(Track Parcel)
        UC2(Book Shipment Request)
        UC3(Submit Feedback & Review)
        UC4(View Service Catalog)
        
        UC5(Register New Package)
        UC6(Convert Booking to Package)
        UC7(Update Package Status)
        UC8(Moderate Reviews)
        UC9(Monitor Performance Stats)
        
        UC10(Deliver Shipments)
        UC11(Manage CNIC & License Profile)
        UC12(Shift Dispatch Operations)
    end

    %% Associations
    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4

    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9

    Driver --> UC10
    Driver --> UC11

    Dispatcher --> UC6
    Dispatcher --> UC12
```

---

## 2. Class Diagram
The **Class Diagram** outlines the static structural design of the database schemas and local model attributes, illustrating the relationships, attributes, datatypes, and multiplicities mapped directly to the Prisma configuration.

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String phone
        +String password
        +UserRole role
        +Boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Driver {
        +String id
        +String userId
        +String cnic
        +String licenseNo
        +String city
        +Boolean isAvailable
        +Float rating
        +Int totalDeliveries
        +DateTime joinedAt
    }

    class Vehicle {
        +String id
        +String driverId
        +VehicleType type
        +String plateNo
        +String brand
        +String model
        +String color
        +DateTime insuranceExpiry
    }

    class Dispatcher {
        +String id
        +String userId
        +String employeeId
        +String shift
    }

    class Address {
        +String id
        +String street
        +String area
        +String city
        +String state
        +String postalCode
        +String country
        +Float latitude
        +Float longitude
        +String instructions
    }

    class Shipment {
        +String id
        +String trackingNo
        +String senderId
        +String receiverId
        +String driverId
        +String pickupAddressId
        +String deliveryAddressId
        +Float weightKg
        +String description
        +ShipmentStatus status
        +Decimal totalAmount
        +PaymentStatus paymentStatus
        +Boolean isFragile
        +Boolean isInsured
        +Decimal insuranceAmount
        +DateTime pickupTime
        +DateTime deliveredAt
    }

    class ShipmentEvent {
        +String id
        +String shipmentId
        +ShipmentStatus status
        +String location
        +Float latitude
        +Float longitude
        +String note
        +DateTime createdAt
    }

    class Payment {
        +String id
        +String shipmentId
        +Decimal amount
        +String method
        +PaymentStatus status
        +String transactionRef
        +DateTime paidAt
    }

    User "1" -- "0..1" Driver : Has Profile
    User "1" -- "0..1" Dispatcher : Has Profile
    Driver "1" -- "0..1" Vehicle : Drives
    User "1" -- "*" Shipment : Sends (SenderShipments)
    User "1" -- "*" Shipment : Receives (ReceiverShipments)
    Driver "1" -- "*" Shipment : Delivers
    Address "1" -- "*" Shipment : PickupAddress
    Address "1" -- "*" Shipment : DeliveryAddress
    Shipment "1" -- "*" ShipmentEvent : Logs Events
    Shipment "1" -- "*" Payment : Records Payments
```

---

## 3. Sequence Diagram
The **Sequence Diagram** models system behavior in chronological order, showing exactly how components call each other and return data when a Customer submits a booking request and an Admin converts it to a trackable shipping parcel.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant UI as 🖥️ Client UI (BookPage / App)
    participant Storage as 💾 Storage Layer (storage.ts)
    participant DB as 📁 LocalStorage
    actor Admin as 🔑 Admin

    %% Customer Booking Request
    Note over Customer, DB: Part A: Customer Booking Process
    Customer->>UI: Fills shipment form (Sender, Receiver, Weight)
    UI->>UI: Calculates rate (max of 299, weight * 300 + 149)
    UI->>Storage: Call addShipment(formData)
    Storage->>DB: Read existing shipments & prepend new (status: "New", ID: "SHP-XXXXXX")
    DB-->>Storage: Write success
    Storage-->>UI: Return created StoredShipment object
    UI-->>Customer: Display Booking Success with Shipment ID

    %% Admin Log in and Conversion
    Note over Admin, DB: Part B: Admin Review & Conversion to Package
    Admin->>UI: Enters admin credentials (admin@amu.com / password123)
    UI->>Storage: Call attemptLogin(email, password)
    Storage->>DB: Set admin session key
    Storage-->>UI: Return login success (true)
    UI-->>Admin: Render Admin Panel Dashboard
    Admin->>UI: Selects "Booking Requests" tab
    UI->>Storage: Call getShipments()
    Storage->>DB: Read amu_shipments key
    DB-->>Storage: Return shipments list
    Storage-->>UI: Populate booking requests table
    Admin->>UI: Clicks "Convert to Package" on booking
    UI->>Storage: Call convertShipmentToPackage(shipmentId)
    Storage->>DB: Retrieve shipment, create StoredPackage (status: "Pending")
    Storage->>DB: Set shipment status to "Converted" & write updates
    DB-->>Storage: Write success
    Storage-->>UI: Return new StoredPackage object with 6-digit tracking ID
    UI-->>Admin: Show success toast with Tracking ID & update table
```

---

## 4. State Machine Diagram
The **State Machine Diagram** depicts the dynamic behavior of shipments/packages, outlining all lifecycle states and the valid transitions that occur through customer booking, admin registration, and courier dispatch.

```mermaid
stateDiagram-v2
    [*] --> Booked : Customer Booked Request
    Booked --> Converted_Pending : Admin Clicks "Convert to Package"
    Booked --> Cancelled : Customer / Admin Cancels
    
    [*] --> Converted_Pending : Admin Directly Registers Package
    
    Converted_Pending --> Picked_Up : Courier Scans/Collects Package
    Converted_Pending --> Cancelled : Admin Cancels
    
    Picked_Up --> In_Transit : Package Dispatched from Origin Hub
    Picked_Up --> Cancelled : Emergency Cancellation
    
    In_Transit --> Out_For_Delivery : Package Arrives at Local Hub
    Out_For_Delivery --> Delivered : Handed over to Receiver (Final)
    Out_For_Delivery --> In_Transit : Delivery Failed (Re-route)
    
    Delivered --> [*]
    Cancelled --> [*]
```

---

## 5. Data Flow Diagram (DFD Level 1)
The **DFD Level 1** diagram details the operational flow of data through processes, illustrating the interactions between external entities (Customers and Admins) and internal local datastores (`amu_packages`, `amu_shipments`, and `amu_reviews`).

```mermaid
graph TD
    %% External Entities
    Customer[👤 Customer]
    Admin[🔑 Admin]

    %% Processes
    P1["1.0<br>Book Shipment Process"]
    P2["2.0<br>Track Package Process"]
    P3["3.0<br>Manage & Convert Parcels"]
    P4["4.0<br>Submit & Moderate Feedback"]

    %% Data Stores
    D1[("💾 D1: amu_shipments")]
    D2[("💾 D2: amu_packages")]
    D3[("💾 D3: amu_reviews")]

    %% Data Flows
    %% Booking Process
    Customer -->|Booking Details| P1
    P1 -->|Calculated Cost| Customer
    P1 -->|New Shipment Record| D1

    %% Tracking Process
    Customer -->|6-Digit Tracking ID| P2
    D2 -->|Package Status & Info| P2
    P2 -->|Timeline Progress & Details| Customer

    %% Managing Process
    Admin -->|Login Credentials| P3
    Admin -->|Status Updates / Deletion| P3
    P3 -->|Package Registration| D2
    D1 -->|Read Pending Bookings| P3
    P3 -->|Update Booking Status| D1
    P3 -->|Create Converted Package| D2
    P3 -->|Updated Tables & Statistics| Admin

    %% Feedback Process
    Customer -->|Reviews & Rating| P4
    P4 -->|Write Review| D3
    D3 -->|Read Feedback List| P4
    Admin -->|Review Deletion Command| P4
    P4 -->|Moderate & Remove Review| D3
    P4 -->|Moderated Reviews List| Admin
    P4 -->|Feedback Feed| Customer
```

---

## 6. Waterfall Model Diagram
The **Waterfall Model Diagram** outlines the linear development life-cycle stages for A.M.U Courriers, starting from requirements formulation through to final code review and system operations.

```mermaid
graph TD
    %% Phase blocks
    P1["📋 Requirements Analysis<br>- Defined Pakistan 50+ Cities scope<br>- Specified Tracking & Booking forms<br>- Outlined Admin dashboards"]
    P2["🎨 System Design<br>- Created Tailwind CSS design system<br>- Designed MySQL/Prisma ERD schema<br>- Developed LocalStorage storage mock API"]
    P3["💻 Coding & Implementation<br>- Coded main application src/App.tsx (React 19)<br>- Styled premium UI component library (src/components/ui.tsx)<br>- Implemented dark mode theme hooks"]
    P4["🔬 Integration & Testing<br>- Verified React components state flow<br>- Tested LocalStorage persistence on refresh<br>- Executed Prisma Client generation & database seeds"]
    P5["🚀 Deployment & Operations<br>- Configured Vite single-file compilation<br>- Deployed to development environments<br>- Reviewed database architecture documentation"]

    %% Flow transitions
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5

    %% Styling
    style P1 fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style P2 fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style P3 fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style P4 fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style P5 fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
```

---

## 7. Spiral Model Diagram
The **Spiral Model Diagram** displays the risk-management-oriented SDLC design, showing how prototypes were continuously reviewed, analyzed, developed, and planned through four quadrants.

```mermaid
graph TD
    subgraph Spiral SDLC Quadrants
        Q1["🎯 Quadrant I: Determine Objectives<br>- Define System Requirements<br>- Identify performance metrics<br>- Specify scope (localStorage vs MySQL)"]
        Q2["🔍 Quadrant II: Risk Analysis & Resolution<br>- Evaluate client-side limitations<br>- Address data persistence issues<br>- Check responsive styling performance"]
        Q3["🛠️ Quadrant III: Develop & Verify Product<br>- Build React 19 Client SPA<br>- Verify tracking visual timeline<br>- Conduct component unit tests"]
        Q4["📅 Quadrant IV: Plan Next Iteration<br>- Plan server-side API integration<br>- Prepare database migration schemes<br>- Refine client UI based on feedback"]
    end

    Q1 --> Q2
    Q2 --> Q3
    Q3 --> Q4
    Q4 --> Q1
```

---

## 8. Scrum Process Diagram
The **Scrum Process Diagram** depicts the agile, sprint-based approach used to collaborate, refine features, and deliver shippable product increments.

```mermaid
graph LR
    %% Backlog elements
    PB[("📋 Product Backlog<br>- User Stories (Track, Book, Review)<br>- Technical Debt (Theme Toggle)<br>- Database Schema (Prisma)")]
    SB[("📂 Sprint Backlog<br>- Task 1: Responsive Layout<br>- Task 2: storage.ts CRUD<br>- Task 3: Admin UI components")]

    %% Process loop
    subgraph Sprint Cycle (2-4 Weeks)
        Sprint["🏃 Active Sprint<br>- Daily Scrum (15 mins)<br>- Team collaboration<br>- Peer review"]
    end

    %% Outputs
    Inc["🚀 Shippable Increment<br>- Fully functional Client SPA<br>- LocalStorage persistent DB<br>- Tested Prisma MySQL Schema"]
    
    PB -->|Sprint Planning| SB
    SB --> Sprint
    Sprint -->|Sprint Review & Retro| Inc

    %% Styling
    style PB fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#fff
    style SB fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#fff
    style Sprint fill:#0f172a,stroke:#06b6d4,stroke-width:3px,color:#fff
    style Inc fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff
```

---

## 9. Rational Iteration Diagram (RUP)
The **Rational Unified Process (RUP) Iteration Diagram** breaks down the software development architecture progression structured in Inception, Elaboration, Construction, and Transition phases.

```mermaid
graph TD
    %% RUP Phases
    subgraph RUP Phase Execution
        I["🎯 Inception Phase<br>- Project Scope & Vision defined<br>- Preliminary architectural design"]
        E["📐 Elaboration Phase<br>- Critical architecture review<br>- Prisma model schema defined<br>- Storage layer API specified"]
        C["🛠️ Construction Phase<br>- React SPA code base development<br>- UI component integration (Tailwind)<br>- Mock data seeding implementation"]
        T["🚀 Transition Phase<br>- Final testing & validation<br>- Dev server deployment<br>- Documentation & code review"]
    end

    I --> E
    E --> C
    C --> T

    %% Iterations within phases
    C -->|Iterative Cycles| C
```
