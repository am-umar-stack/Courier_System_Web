// =============================================================
// A.M.U Courriers — Database Seed Script
// Run: npx tsx prisma/seed.ts
// =============================================================

import { PrismaClient, UserRole, ShipmentStatus, PaymentStatus, VehicleType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding A.M.U Courriers database...\n");

  // ─── Clean existing data ──────────────────────────
  await prisma.notification.deleteMany();
  await prisma.ticketResponse.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.dispatcher.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ────────────────────────────────────────
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin A.M.U",
      email: "admin@amucourriers.pk",
      phone: "+92 300 1111111",
      password,
      role: UserRole.ADMIN,
    },
  });

  const dispatcherUser = await prisma.user.create({
    data: {
      name: "Fatima Khan",
      email: "fatima@amucourriers.pk",
      phone: "+92 300 2222222",
      password,
      role: UserRole.DISPATCHER,
    },
  });

  const driverUser1 = await prisma.user.create({
    data: {
      name: "Hassan Khan",
      email: "hassan@amucourriers.pk",
      phone: "+92 321 1234567",
      password,
      role: UserRole.DRIVER,
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      name: "Bilal Hussain",
      email: "bilal@amucourriers.pk",
      phone: "+92 300 5551234",
      password,
      role: UserRole.DRIVER,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Muhammad Ali",
      email: "mali@example.com",
      phone: "+92 333 9876543",
      password,
      role: UserRole.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Fatima Ahmed",
      email: "fatima.a@example.com",
      phone: "+92 333 8765432",
      password,
      role: UserRole.CUSTOMER,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "TechnoSoft Pvt Ltd",
      email: "info@technosoft.pk",
      phone: "+92 51 1234567",
      password,
      role: UserRole.CUSTOMER,
    },
  });

  console.log("  ✓ Users created");

  // ─── Dispatcher ───────────────────────────────────
  await prisma.dispatcher.create({
    data: {
      userId: dispatcherUser.id,
      employeeId: "DSP-001",
      shift: "MORNING",
    },
  });

  // ─── Drivers ──────────────────────────────────────
  const driver1 = await prisma.driver.create({
    data: {
      userId: driverUser1.id,
      cnic: "4210112345671",
      licenseNo: "LHR-2024-12345",
      city: "Karachi",
      isAvailable: false,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      userId: driverUser2.id,
      cnic: "4210112345672",
      licenseNo: "ISB-2024-67890",
      city: "Islamabad",
    },
  });

  // ─── Vehicles ─────────────────────────────────────
  await prisma.vehicle.create({
    data: {
      driverId: driver1.id,
      type: VehicleType.BIKE,
      plateNo: "LEA-1234",
      brand: "Honda",
      model: "CD 70",
      color: "Red",
    },
  });

  await prisma.vehicle.create({
    data: {
      driverId: driver2.id,
      type: VehicleType.VAN,
      plateNo: "RWP-9921",
      brand: "Toyota",
      model: "Hilux",
      color: "White",
    },
  });

  console.log("  ✓ Drivers & Vehicles created");

  // ─── Addresses ────────────────────────────────────
  const pickup1 = await prisma.address.create({
    data: {
      street: "Plot 42, Scheme 5",
      area: "Clifton",
      city: "Karachi",
      state: "Sindh",
      postalCode: "75600",
      instructions: "Gate code: 1423",
    },
  });

  const delivery1 = await prisma.address.create({
    data: {
      street: "12 B, Main Boulevard",
      area: "Gulberg",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      instructions: "Leave with guard",
    },
  });

  const pickup2 = await prisma.address.create({
    data: {
      street: "Office 5, 3rd Floor",
      area: "F-8 Markaz",
      city: "Islamabad",
      state: "ICT",
      instructions: "Call on arrival",
    },
  });

  const delivery2 = await prisma.address.create({
    data: {
      street: "17-A, University Road",
      area: "Cantt",
      city: "Peshawar",
      state: "KP",
    },
  });

  console.log("  ✓ Addresses created");

  // ─── Shipments ────────────────────────────────────
  const shipment1 = await prisma.shipment.create({
    data: {
      trackingNo: "AMU-2026-001",
      senderId: customer1.id,
      receiverId: customer2.id,
      driverId: driver1.id,
      pickupAddressId: pickup1.id,
      deliveryAddressId: delivery1.id,
      weightKg: 2.4,
      description: "Documents and a small gift",
      status: ShipmentStatus.OUT_FOR_DELIVERY,
      totalAmount: 450,
      paymentStatus: PaymentStatus.PAID,
      isInsured: true,
      insuranceAmount: 10000,
      pickupTime: new Date("2026-01-15T06:20:00Z"),
    },
  });

  const shipment2 = await prisma.shipment.create({
    data: {
      trackingNo: "AMU-2026-002",
      senderId: customer3.id,
      receiverId: customer2.id,
      driverId: driver2.id,
      pickupAddressId: pickup2.id,
      deliveryAddressId: delivery2.id,
      weightKg: 18.5,
      description: "Electronics equipment",
      status: ShipmentStatus.IN_TRANSIT,
      totalAmount: 2200,
      paymentStatus: PaymentStatus.PAID,
      isFragile: true,
      isInsured: true,
      insuranceAmount: 50000,
      pickupTime: new Date("2026-01-14T10:00:00Z"),
    },
  });

  console.log("  ✓ Shipments created");

  // ─── Shipment Events ──────────────────────────────
  await prisma.shipmentEvent.createMany({
    data: [
      // Shipment 1 events
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.BOOKED,
        location: "Online",
        note: "Shipment created",
        createdAt: new Date("2026-01-14T15:05:00Z"),
      },
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.PICKED_UP,
        location: "Clifton, Karachi",
        note: "Collected from sender",
        createdAt: new Date("2026-01-14T18:20:00Z"),
      },
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.IN_TRANSIT,
        location: "Motorway M-2",
        note: "Package on the move",
        createdAt: new Date("2026-01-15T07:15:00Z"),
      },
      {
        shipmentId: shipment1.id,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        location: "Gulberg, Lahore",
        note: "Driver Hassan is 2.3 km away",
        createdAt: new Date("2026-01-15T11:42:00Z"),
      },
      // Shipment 2 events
      {
        shipmentId: shipment2.id,
        status: ShipmentStatus.BOOKED,
        location: "Online",
        note: "Shipment created",
        createdAt: new Date("2026-01-13T09:00:00Z"),
      },
      {
        shipmentId: shipment2.id,
        status: ShipmentStatus.PICKED_UP,
        location: "F-8 Markaz, Islamabad",
        note: "Collected",
        createdAt: new Date("2026-01-14T10:00:00Z"),
      },
      {
        shipmentId: shipment2.id,
        status: ShipmentStatus.IN_TRANSIT,
        location: "GT Road, Taxila",
        note: "120 km to destination",
        createdAt: new Date("2026-01-15T09:30:00Z"),
      },
    ],
  });

  console.log("  ✓ Shipment events created\n");
  console.log("✅ Seeding complete!");
  console.log("\n🔑 Test credentials (all users): password123");
  console.log("📧 Admin: admin@amucourriers.pk");
  console.log("📧 Customer: mali@example.com\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
