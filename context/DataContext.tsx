import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";
export type AnnouncementCategory = "maintenance" | "general" | "event" | "emergency";
export type MaintenanceStatus = "paid" | "pending" | "overdue";
export type ComplaintStatus = "open" | "in-progress" | "resolved" | "closed";
export type ComplaintCategory = "electrical" | "plumbing" | "civil" | "security" | "cleanliness" | "other";
export type ComplaintPriority = "low" | "medium" | "high";
export type NOCStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "confirmed" | "pending" | "cancelled";
export type GatePassStatus = "active" | "used" | "expired";
export type MeetingType = "AGM" | "Emergency" | "Committee" | "General";
export type SocietyStatus = "pending" | "approved" | "rejected";
export type VisitorRequestStatus = "pending" | "approved" | "rejected";

export interface VisitorRequest {
  id: string;
  flatNumber: string;
  residentName: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  vehicleNumber?: string;
  status: VisitorRequestStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  gatePassId?: string;
  gatePassCode?: string;
}

export interface SocietyRegistration {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalFlats: number;
  wings: string;
  secretaryName: string;
  secretaryPhone: string;
  secretaryEmail: string;
  registrationNumber: string;
  establishedYear: number;
  status: SocietyStatus;
  appliedDate: string;
  approvedDate?: string;
  approvedBy?: string;
  rejectedDate?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  createdBy: string;
  createdAt: string;
  category: AnnouncementCategory;
}

export interface MaintenanceRecord {
  id: string;
  flatNumber: string;
  residentName: string;
  amount: number;
  month: string;
  dueDate: string;
  paidDate?: string;
  status: MaintenanceStatus;
  paymentMethod?: string;
}

export interface Contribution {
  id: string;
  flatNumber: string;
  residentName: string;
  amount: number;
  date: string;
}

export interface FestivalFund {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  collectedAmount: number;
  dueDate: string;
  contributions: Contribution[];
  status: "active" | "completed";
  createdBy: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: MeetingType;
  agenda: string[];
  rsvpYes: string[];
  rsvpNo: string[];
  createdBy: string;
}

export interface Booking {
  id: string;
  amenity: string;
  flatNumber: string;
  residentName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose?: string;
}

export interface GatePass {
  id: string;
  passCode: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  flatNumber: string;
  residentName: string;
  validFrom: string;
  validTill: string;
  status: GatePassStatus;
  vehicleNumber?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  flatNumber: string;
  phone: string;
  email: string;
  type: "owner" | "tenant";
  moveInDate: string;
  familySize: number;
  vehicles: string[];
  isActive: boolean;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  joinDate: string;
  shift: string;
  isActive: boolean;
}

export interface Comment {
  text: string;
  by: string;
  at: string;
}

export interface Complaint {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  flatNumber: string;
  residentName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  comments: Comment[];
}

export interface NOCRequest {
  id: string;
  flatNumber: string;
  ownerName: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  purpose: string;
  requestDate: string;
  validFrom: string;
  validTill: string;
  status: NOCStatus;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

interface DataContextType {
  announcements: Announcement[];
  maintenance: MaintenanceRecord[];
  festivals: FestivalFund[];
  meetings: Meeting[];
  bookings: Booking[];
  gatePasses: GatePass[];
  members: Member[];
  workers: Worker[];
  complaints: Complaint[];
  nocRequests: NOCRequest[];
  societies: SocietyRegistration[];
  visitorRequests: VisitorRequest[];
  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => Promise<void>;
  addMeeting: (m: Omit<Meeting, "id">) => Promise<void>;
  addBooking: (b: Omit<Booking, "id">) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  addGatePass: (g: Omit<GatePass, "id" | "passCode" | "createdAt">) => Promise<void>;
  addComplaint: (c: Omit<Complaint, "id" | "ticketNo" | "createdAt" | "updatedAt" | "comments">) => Promise<void>;
  updateComplaintStatus: (id: string, status: ComplaintStatus, comment?: string, by?: string) => Promise<void>;
  addNOCRequest: (n: Omit<NOCRequest, "id" | "requestDate" | "status">) => Promise<void>;
  updateNOCStatus: (id: string, status: NOCStatus, approvedBy?: string, remarks?: string) => Promise<void>;
  payMaintenance: (id: string, method: string) => Promise<void>;
  addFestivalContribution: (festivalId: string, contribution: Omit<Contribution, "id" | "date">) => Promise<void>;
  addFestival: (f: Omit<FestivalFund, "id" | "collectedAmount" | "contributions">) => Promise<void>;
  rsvpMeeting: (meetingId: string, flatNumber: string, attending: boolean) => Promise<void>;
  addSocietyRegistration: (s: Omit<SocietyRegistration, "id" | "appliedDate" | "status">) => Promise<void>;
  updateSocietyStatus: (id: string, status: SocietyStatus, by: string, reason?: string) => Promise<void>;
  addVisitorRequest: (v: Omit<VisitorRequest, "id" | "requestedAt" | "status">) => Promise<void>;
  updateVisitorRequestStatus: (id: string, status: VisitorRequestStatus, by?: string, reason?: string) => Promise<string | null>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Water Supply Disruption — Thursday", content: "Due to pipeline maintenance, water supply will be disrupted on Thursday, 14th March 2026 from 10:00 AM to 4:00 PM. Please store adequate water. Inconvenience regretted.", priority: "high", category: "maintenance", createdBy: "Anita Sharma", createdAt: "2026-03-11T09:00:00Z" },
  { id: "a2", title: "Annual General Meeting — 25th March", content: "The Annual General Meeting of Green Valley CHS will be held on 25th March 2026 at 6:00 PM in the Clubhouse. All flat owners are requested to attend. Agenda will be shared separately.", priority: "medium", category: "event", createdBy: "Anita Sharma", createdAt: "2026-03-10T08:00:00Z" },
  { id: "a3", title: "New Parking Rules Effective 1st April", content: "From 1st April 2026, visitor parking will only be allowed in designated zones B4-B10. Vehicles parked in prohibited areas will be towed. Residents are requested to display their parking stickers.", priority: "medium", category: "general", createdBy: "Suresh Mehta", createdAt: "2026-03-09T10:30:00Z" },
  { id: "a4", title: "Lift Maintenance — Wing A", content: "Lift in Wing A will undergo annual maintenance on 12th March 2026. It will be non-operational from 9:00 AM to 1:00 PM. Please use the staircase. Emergency contact: 9876543210.", priority: "urgent", category: "maintenance", createdBy: "Anita Sharma", createdAt: "2026-03-08T07:00:00Z" },
  { id: "a5", title: "Holi Celebration — 14th March", content: "Join us for a grand Holi celebration on 14th March at the society garden. Event starts at 9:00 AM. Colors and refreshments will be provided. Bring your family and friends!", priority: "low", category: "event", createdBy: "Suresh Mehta", createdAt: "2026-03-07T11:00:00Z" },
];

const SEED_MAINTENANCE: MaintenanceRecord[] = [
  { id: "m1", flatNumber: "A-101", residentName: "Rajesh Kumar", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "paid", paidDate: "2026-03-03", paymentMethod: "UPI" },
  { id: "m2", flatNumber: "A-102", residentName: "Deepa Nair", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "pending" },
  { id: "m3", flatNumber: "B-201", residentName: "Priya Patel", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "paid", paidDate: "2026-03-04", paymentMethod: "Bank Transfer" },
  { id: "m4", flatNumber: "B-202", residentName: "Vikram Joshi", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "overdue" },
  { id: "m5", flatNumber: "C-301", residentName: "Amit Singh", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "pending" },
  { id: "m6", flatNumber: "C-302", residentName: "Sunita Rao", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "paid", paidDate: "2026-03-01", paymentMethod: "Cheque" },
  { id: "m7", flatNumber: "D-401", residentName: "Mohan Gupta", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "overdue" },
  { id: "m8", flatNumber: "D-402", residentName: "Kavita Reddy", amount: 2500, month: "March 2026", dueDate: "2026-03-05", status: "pending" },
];

const SEED_FESTIVALS: FestivalFund[] = [
  { id: "f1", title: "Holi Celebration 2026", description: "Fund collection for Holi celebration on 14th March. Covers colors, refreshments, decorations and music.", targetAmount: 25000, collectedAmount: 15000, dueDate: "2026-03-13", status: "active", createdBy: "Suresh Mehta", contributions: [{ id: "c1", flatNumber: "A-101", residentName: "Rajesh Kumar", amount: 2000, date: "2026-03-05" }, { id: "c2", flatNumber: "B-201", residentName: "Priya Patel", amount: 2000, date: "2026-03-06" }, { id: "c3", flatNumber: "C-301", residentName: "Amit Singh", amount: 1500, date: "2026-03-07" }, { id: "c4", flatNumber: "C-302", residentName: "Sunita Rao", amount: 2000, date: "2026-03-07" }, { id: "c5", flatNumber: "A-102", residentName: "Deepa Nair", amount: 2000, date: "2026-03-08" }, { id: "c6", flatNumber: "B-202", residentName: "Vikram Joshi", amount: 1500, date: "2026-03-08" }, { id: "c7", flatNumber: "D-401", residentName: "Mohan Gupta", amount: 2000, date: "2026-03-09" }, { id: "c8", flatNumber: "D-402", residentName: "Kavita Reddy", amount: 2000, date: "2026-03-09" }] },
  { id: "f2", title: "Navratri Utsav Fund", description: "Advance fund collection for Navratri celebrations.", targetAmount: 40000, collectedAmount: 8000, dueDate: "2026-09-15", status: "active", createdBy: "Anita Sharma", contributions: [{ id: "c9", flatNumber: "A-101", residentName: "Rajesh Kumar", amount: 2000, date: "2026-03-01" }, { id: "c10", flatNumber: "B-201", residentName: "Priya Patel", amount: 2000, date: "2026-03-02" }, { id: "c11", flatNumber: "C-301", residentName: "Amit Singh", amount: 2000, date: "2026-03-03" }, { id: "c12", flatNumber: "D-401", residentName: "Mohan Gupta", amount: 2000, date: "2026-03-04" }] },
];

const SEED_MEETINGS: Meeting[] = [
  { id: "mt1", title: "Annual General Meeting 2026", description: "Yearly meeting to discuss society accounts, upcoming projects, and committee elections.", date: "2026-03-25", time: "18:00", location: "Clubhouse, Green Valley CHS", type: "AGM", agenda: ["Annual accounts review", "Maintenance fund discussion", "New construction proposal", "Committee elections", "Open forum"], rsvpYes: ["A-101", "B-201", "C-302"], rsvpNo: ["B-202"], createdBy: "Anita Sharma" },
  { id: "mt2", title: "Emergency Meeting — Security Concerns", description: "Emergency meeting called due to recent security incidents in the society.", date: "2026-03-15", time: "19:00", location: "Society Office", type: "Emergency", agenda: ["Review of incidents", "CCTV upgrade proposal", "Security staff evaluation", "New entry protocols"], rsvpYes: ["A-101", "A-102", "C-301"], rsvpNo: [], createdBy: "Suresh Mehta" },
];

const SEED_BOOKINGS: Booking[] = [
  { id: "bk1", amenity: "Clubhouse", flatNumber: "A-101", residentName: "Rajesh Kumar", date: "2026-03-14", startTime: "10:00", endTime: "14:00", status: "confirmed", purpose: "Birthday party" },
  { id: "bk2", amenity: "Swimming Pool", flatNumber: "B-201", residentName: "Priya Patel", date: "2026-03-12", startTime: "07:00", endTime: "09:00", status: "confirmed", purpose: "Morning swim" },
  { id: "bk3", amenity: "Gym", flatNumber: "C-301", residentName: "Amit Singh", date: "2026-03-13", startTime: "06:00", endTime: "07:30", status: "confirmed" },
  { id: "bk4", amenity: "Badminton Court", flatNumber: "D-401", residentName: "Mohan Gupta", date: "2026-03-11", startTime: "17:00", endTime: "19:00", status: "confirmed" },
];

const SEED_GATE_PASSES: GatePass[] = [
  { id: "gp1", passCode: "GV-2026-4821", visitorName: "Arjun Mehta", visitorPhone: "+91 99887 76655", purpose: "Visiting relative", flatNumber: "A-101", residentName: "Rajesh Kumar", validFrom: "2026-03-11", validTill: "2026-03-11", status: "active", createdAt: "2026-03-11T08:00:00Z" },
  { id: "gp2", passCode: "GV-2026-3917", visitorName: "Swiggy Delivery", visitorPhone: "+91 98765 00000", purpose: "Food delivery", flatNumber: "B-201", residentName: "Priya Patel", validFrom: "2026-03-10", validTill: "2026-03-10", status: "used", createdAt: "2026-03-10T19:30:00Z" },
  { id: "gp3", passCode: "GV-2026-5534", visitorName: "Reena Singh", visitorPhone: "+91 77665 44332", purpose: "Plumber visit", flatNumber: "C-301", residentName: "Amit Singh", validFrom: "2026-03-12", validTill: "2026-03-12", status: "active", vehicleNumber: "MH-01-AB-1234", createdAt: "2026-03-11T10:00:00Z" },
];

const SEED_MEMBERS: Member[] = [
  { id: "mb1", name: "Rajesh Kumar", flatNumber: "A-101", phone: "+91 76543 21098", email: "rajesh@gmail.com", type: "owner", moveInDate: "2020-06-15", familySize: 3, vehicles: ["MH-01-CA-9876"], isActive: true },
  { id: "mb2", name: "Deepa Nair", flatNumber: "A-102", phone: "+91 87654 11223", email: "deepa@gmail.com", type: "tenant", moveInDate: "2023-01-10", familySize: 2, vehicles: [], isActive: true },
  { id: "mb3", name: "Priya Patel", flatNumber: "B-201", phone: "+91 65432 10987", email: "priya@gmail.com", type: "owner", moveInDate: "2019-03-20", familySize: 4, vehicles: ["MH-01-CB-5432", "MH-01-CC-2345"], isActive: true },
  { id: "mb4", name: "Vikram Joshi", flatNumber: "B-202", phone: "+91 54321 98765", email: "vikram@gmail.com", type: "owner", moveInDate: "2021-08-01", familySize: 2, vehicles: ["MH-01-AA-7654"], isActive: true },
  { id: "mb5", name: "Amit Singh", flatNumber: "C-301", phone: "+91 54321 09876", email: "amit@gmail.com", type: "tenant", moveInDate: "2024-02-15", familySize: 3, vehicles: ["MH-01-BA-4321"], isActive: true },
  { id: "mb6", name: "Sunita Rao", flatNumber: "C-302", phone: "+91 43210 87654", email: "sunita@gmail.com", type: "owner", moveInDate: "2018-11-30", familySize: 5, vehicles: ["MH-01-BB-9876"], isActive: true },
  { id: "mb7", name: "Mohan Gupta", flatNumber: "D-401", phone: "+91 32109 76543", email: "mohan@gmail.com", type: "owner", moveInDate: "2022-04-10", familySize: 2, vehicles: [], isActive: true },
  { id: "mb8", name: "Kavita Reddy", flatNumber: "D-402", phone: "+91 21098 65432", email: "kavita@gmail.com", type: "tenant", moveInDate: "2025-01-01", familySize: 1, vehicles: ["MH-01-BC-6543"], isActive: true },
];

const SEED_WORKERS: Worker[] = [
  { id: "w1", name: "Ramesh Yadav", role: "Security Guard", phone: "+91 99887 11223", joinDate: "2020-01-15", shift: "Day (6AM-2PM)", isActive: true },
  { id: "w2", name: "Santosh Kumar", role: "Security Guard", phone: "+91 88776 22334", joinDate: "2021-06-01", shift: "Night (10PM-6AM)", isActive: true },
  { id: "w3", name: "Munna Lal", role: "Sweeper", phone: "+91 77665 33445", joinDate: "2019-03-10", shift: "Morning (6AM-12PM)", isActive: true },
  { id: "w4", name: "Raju Plumber", role: "Plumber", phone: "+91 66554 44556", joinDate: "2022-08-20", shift: "Day (9AM-5PM)", isActive: true },
  { id: "w5", name: "Bijli Electrician", role: "Electrician", phone: "+91 55443 55667", joinDate: "2023-02-14", shift: "Day (9AM-5PM)", isActive: true },
  { id: "w6", name: "Suresh Mali", role: "Gardener", phone: "+91 44332 66778", joinDate: "2020-09-05", shift: "Morning (6AM-10AM)", isActive: true },
];

const SEED_COMPLAINTS: Complaint[] = [
  { id: "cp1", ticketNo: "TKT-001", title: "Water leakage in bathroom", description: "There is a water pipe leakage in the bathroom wall. Water is seeping through and damaging the wall paint.", category: "plumbing", priority: "high", status: "in-progress", flatNumber: "A-102", residentName: "Deepa Nair", createdAt: "2026-03-08T14:00:00Z", updatedAt: "2026-03-09T10:00:00Z", assignedTo: "Raju Plumber", comments: [{ text: "Assigned to Raju Plumber. Will visit on 12th March.", by: "Secretary", at: "2026-03-09T10:00:00Z" }] },
  { id: "cp2", ticketNo: "TKT-002", title: "Streetlight not working near Block D", description: "The streetlight near the entrance of Block D has not been working for the past week. Creates safety concerns at night.", category: "electrical", priority: "medium", status: "open", flatNumber: "D-401", residentName: "Mohan Gupta", createdAt: "2026-03-10T20:00:00Z", updatedAt: "2026-03-10T20:00:00Z", comments: [] },
  { id: "cp3", ticketNo: "TKT-003", title: "Staircase not cleaned regularly", description: "The staircase in Wing C is not being cleaned regularly. Dust and cobwebs have accumulated.", category: "cleanliness", priority: "low", status: "resolved", flatNumber: "C-301", residentName: "Amit Singh", createdAt: "2026-03-05T09:00:00Z", updatedAt: "2026-03-07T16:00:00Z", resolvedAt: "2026-03-07T16:00:00Z", assignedTo: "Munna Lal", comments: [{ text: "Cleaned. Will add to daily checklist.", by: "Secretary", at: "2026-03-07T16:00:00Z" }] },
];

const SEED_NOC: NOCRequest[] = [
  { id: "noc1", flatNumber: "A-102", ownerName: "Hemant Nair", tenantName: "Deepa Nair", tenantPhone: "+91 87654 11223", tenantEmail: "deepa@gmail.com", purpose: "Residential rental", requestDate: "2022-12-20", validFrom: "2023-01-10", validTill: "2025-01-09", status: "approved", approvedBy: "Anita Sharma", approvedAt: "2022-12-25", remarks: "Approved. Renewal required after expiry." },
  { id: "noc2", flatNumber: "C-301", ownerName: "Ramesh Singh", tenantName: "Amit Singh", tenantPhone: "+91 54321 09876", tenantEmail: "amit@gmail.com", purpose: "Residential rental", requestDate: "2024-02-01", validFrom: "2024-02-15", validTill: "2026-02-14", status: "approved", approvedBy: "Suresh Mehta", approvedAt: "2024-02-10" },
  { id: "noc3", flatNumber: "D-402", ownerName: "Suresh Reddy", tenantName: "Kavita Reddy", tenantPhone: "+91 21098 65432", tenantEmail: "kavita@gmail.com", purpose: "Residential rental", requestDate: "2024-12-20", validFrom: "2025-01-01", validTill: "2026-12-31", status: "pending" },
];

const SEED_SOCIETIES: SocietyRegistration[] = [
  {
    id: "soc1",
    name: "Green Valley CHS",
    address: "Plot 42, Sector 21",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    totalFlats: 48,
    wings: "A, B, C, D",
    secretaryName: "Anita Sharma",
    secretaryPhone: "+91 87654 32109",
    secretaryEmail: "secretary@greenvalleychs.com",
    registrationNumber: "MH-CHS-2018-04521",
    establishedYear: 2018,
    status: "approved",
    appliedDate: "2018-06-01",
    approvedDate: "2018-06-15",
    approvedBy: "Suresh Mehta",
    notes: "Flagship society. All documentation verified.",
  },
  {
    id: "soc2",
    name: "Sunshine Heights CHS",
    address: "Survey No. 78, Baner Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411045",
    totalFlats: 120,
    wings: "A, B, C, D, E, F",
    secretaryName: "Pradeep Kulkarni",
    secretaryPhone: "+91 98123 45678",
    secretaryEmail: "secretary@sunshineheights.in",
    registrationNumber: "MH-CHS-2024-09872",
    establishedYear: 2024,
    status: "pending",
    appliedDate: "2026-02-15",
    notes: "Large society. Awaiting physical inspection.",
  },
  {
    id: "soc3",
    name: "Lakeview Apartments",
    address: "Near Powai Lake, Hiranandani",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400076",
    totalFlats: 64,
    wings: "Tower 1, Tower 2",
    secretaryName: "Meena Iyer",
    secretaryPhone: "+91 91234 56789",
    secretaryEmail: "admin@lakeviewapts.com",
    registrationNumber: "MH-CHS-2025-11203",
    establishedYear: 2025,
    status: "pending",
    appliedDate: "2026-03-01",
    notes: "New construction society. Documents under review.",
  },
  {
    id: "soc4",
    name: "Palm Grove Society",
    address: "Plot 7, Whitefield Layout",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560066",
    totalFlats: 80,
    wings: "North, South, East, West",
    secretaryName: "Ravi Shankar",
    secretaryPhone: "+91 80765 43210",
    secretaryEmail: "ravi@palmgrove.co.in",
    registrationNumber: "KA-CHS-2021-00345",
    establishedYear: 2021,
    status: "approved",
    appliedDate: "2021-09-10",
    approvedDate: "2021-09-28",
    approvedBy: "Suresh Mehta",
  },
  {
    id: "soc5",
    name: "Silver Oak CHS",
    address: "Sector 12, Dwarka",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110075",
    totalFlats: 36,
    wings: "Block A, Block B",
    secretaryName: "Neha Gupta",
    secretaryPhone: "+91 99001 23456",
    secretaryEmail: "neha@silveroak.in",
    registrationNumber: "DL-CHS-2023-00781",
    establishedYear: 2023,
    status: "rejected",
    appliedDate: "2025-11-20",
    rejectedDate: "2025-12-10",
    rejectedBy: "Suresh Mehta",
    rejectionReason: "Incomplete documentation. Registration number could not be verified with local municipal authority.",
  },
  {
    id: "soc6",
    name: "Emerald Gardens CHS",
    address: "Plot 19, Sarjapur Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560035",
    totalFlats: 96,
    wings: "A, B, C",
    secretaryName: "Sunil Nair",
    secretaryPhone: "+91 77889 90011",
    secretaryEmail: "sunil@emeraldgardens.org",
    registrationNumber: "KA-CHS-2026-00512",
    establishedYear: 2026,
    status: "pending",
    appliedDate: "2026-03-08",
    notes: "New society. All documents submitted.",
  },
];

const SEED_VISITORS: VisitorRequest[] = [
  {
    id: "vr1",
    flatNumber: "A-101",
    residentName: "Rajesh Kumar",
    visitorName: "Arjun Mehta",
    visitorPhone: "+91 99887 76655",
    purpose: "Family visit",
    expectedDate: "2026-04-12",
    expectedTime: "11:00",
    vehicleNumber: "MH-01-CD-5566",
    status: "pending",
    requestedAt: "2026-04-11T08:30:00Z",
  },
  {
    id: "vr2",
    flatNumber: "B-201",
    residentName: "Priya Patel",
    visitorName: "Kiran Shah",
    visitorPhone: "+91 88990 12345",
    purpose: "Plumber — pipe repair",
    expectedDate: "2026-04-11",
    expectedTime: "10:00",
    status: "approved",
    requestedAt: "2026-04-10T18:00:00Z",
    approvedBy: "Anita Sharma",
    approvedAt: "2026-04-10T20:00:00Z",
    gatePassId: "gp-vr2",
    gatePassCode: "GV-2026-7731",
  },
  {
    id: "vr3",
    flatNumber: "C-301",
    residentName: "Amit Singh",
    visitorName: "Unknown Delivery",
    visitorPhone: "+91 00000 11111",
    purpose: "Package delivery",
    expectedDate: "2026-04-10",
    expectedTime: "14:00",
    status: "rejected",
    requestedAt: "2026-04-10T13:00:00Z",
    rejectedAt: "2026-04-10T13:30:00Z",
    rejectionReason: "Visitor phone number unverifiable. Please re-raise with valid contact.",
  },
  {
    id: "vr4",
    flatNumber: "D-401",
    residentName: "Mohan Gupta",
    visitorName: "Sunaina Gupta",
    visitorPhone: "+91 76543 11223",
    purpose: "Relative staying for 2 days",
    expectedDate: "2026-04-13",
    expectedTime: "16:00",
    status: "pending",
    requestedAt: "2026-04-11T09:00:00Z",
  },
  {
    id: "vr5",
    flatNumber: "A-102",
    residentName: "Deepa Nair",
    visitorName: "Zomato Delivery",
    visitorPhone: "+91 98765 00001",
    purpose: "Food delivery",
    expectedDate: "2026-04-11",
    expectedTime: "13:30",
    status: "approved",
    requestedAt: "2026-04-11T13:00:00Z",
    approvedBy: "Suresh Mehta",
    approvedAt: "2026-04-11T13:10:00Z",
    gatePassId: "gp-vr5",
    gatePassCode: "GV-2026-8892",
  },
];

const STORAGE_KEYS = {
  announcements: "@society_announcements",
  maintenance: "@society_maintenance",
  festivals: "@society_festivals",
  meetings: "@society_meetings",
  bookings: "@society_bookings",
  gatePasses: "@society_gatepasses",
  members: "@society_members",
  workers: "@society_workers",
  complaints: "@society_complaints",
  nocRequests: "@society_noc",
  societies: "@society_registrations",
  seeded: "@society_seeded_v2",
  visitorRequests: "@society_visitor_requests",
  visitorSeeded: "@society_visitors_seeded_v1",
};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generatePassCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `GV-2026-${num}`;
}

function generateTicketNo(complaints: Complaint[]) {
  const next = complaints.length + 1;
  return `TKT-${String(next).padStart(3, "0")}`;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [festivals, setFestivals] = useState<FestivalFund[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [nocRequests, setNocRequests] = useState<NOCRequest[]>([]);
  const [societies, setSocieties] = useState<SocietyRegistration[]>([]);
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequest[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  async function initializeData() {
    const seeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
    if (!seeded) {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(SEED_ANNOUNCEMENTS)),
        AsyncStorage.setItem(STORAGE_KEYS.maintenance, JSON.stringify(SEED_MAINTENANCE)),
        AsyncStorage.setItem(STORAGE_KEYS.festivals, JSON.stringify(SEED_FESTIVALS)),
        AsyncStorage.setItem(STORAGE_KEYS.meetings, JSON.stringify(SEED_MEETINGS)),
        AsyncStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(SEED_BOOKINGS)),
        AsyncStorage.setItem(STORAGE_KEYS.gatePasses, JSON.stringify(SEED_GATE_PASSES)),
        AsyncStorage.setItem(STORAGE_KEYS.members, JSON.stringify(SEED_MEMBERS)),
        AsyncStorage.setItem(STORAGE_KEYS.workers, JSON.stringify(SEED_WORKERS)),
        AsyncStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(SEED_COMPLAINTS)),
        AsyncStorage.setItem(STORAGE_KEYS.nocRequests, JSON.stringify(SEED_NOC)),
        AsyncStorage.setItem(STORAGE_KEYS.societies, JSON.stringify(SEED_SOCIETIES)),
        AsyncStorage.setItem(STORAGE_KEYS.seeded, "true"),
      ]);
    }
    // Visitor requests seeded separately to preserve existing data
    const visitorSeeded = await AsyncStorage.getItem(STORAGE_KEYS.visitorSeeded);
    if (!visitorSeeded) {
      await AsyncStorage.setItem(STORAGE_KEYS.visitorRequests, JSON.stringify(SEED_VISITORS));
      await AsyncStorage.setItem(STORAGE_KEYS.visitorSeeded, "true");
    }
    const [a, m, f, mt, bk, gp, mb, wk, cp, noc, soc, vr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.announcements),
      AsyncStorage.getItem(STORAGE_KEYS.maintenance),
      AsyncStorage.getItem(STORAGE_KEYS.festivals),
      AsyncStorage.getItem(STORAGE_KEYS.meetings),
      AsyncStorage.getItem(STORAGE_KEYS.bookings),
      AsyncStorage.getItem(STORAGE_KEYS.gatePasses),
      AsyncStorage.getItem(STORAGE_KEYS.members),
      AsyncStorage.getItem(STORAGE_KEYS.workers),
      AsyncStorage.getItem(STORAGE_KEYS.complaints),
      AsyncStorage.getItem(STORAGE_KEYS.nocRequests),
      AsyncStorage.getItem(STORAGE_KEYS.societies),
      AsyncStorage.getItem(STORAGE_KEYS.visitorRequests),
    ]);
    if (a) setAnnouncements(JSON.parse(a));
    if (m) setMaintenance(JSON.parse(m));
    if (f) setFestivals(JSON.parse(f));
    if (mt) setMeetings(JSON.parse(mt));
    if (bk) setBookings(JSON.parse(bk));
    if (gp) setGatePasses(JSON.parse(gp));
    if (mb) setMembers(JSON.parse(mb));
    if (wk) setWorkers(JSON.parse(wk));
    if (cp) {
      const parsed: Complaint[] = JSON.parse(cp);
      setComplaints(parsed.map((c) => ({ ...c, status: c.status ?? "open", comments: c.comments ?? [] })));
    }
    if (noc) setNocRequests(JSON.parse(noc));
    if (soc) setSocieties(JSON.parse(soc));
    if (vr) setVisitorRequests(JSON.parse(vr));
  }

  async function save<T>(key: string, data: T[]) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  async function addAnnouncement(a: Omit<Announcement, "id" | "createdAt">) {
    const newA: Announcement = { ...a, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [newA, ...announcements];
    setAnnouncements(updated);
    await save(STORAGE_KEYS.announcements, updated);
  }

  async function addMeeting(m: Omit<Meeting, "id">) {
    const newM: Meeting = { ...m, id: generateId() };
    const updated = [newM, ...meetings];
    setMeetings(updated);
    await save(STORAGE_KEYS.meetings, updated);
  }

  async function addBooking(b: Omit<Booking, "id">) {
    const newB: Booking = { ...b, id: generateId() };
    const updated = [newB, ...bookings];
    setBookings(updated);
    await save(STORAGE_KEYS.bookings, updated);
  }

  async function cancelBooking(id: string) {
    const updated = bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b));
    setBookings(updated);
    await save(STORAGE_KEYS.bookings, updated);
  }

  async function addGatePass(g: Omit<GatePass, "id" | "passCode" | "createdAt">) {
    const newG: GatePass = { ...g, id: generateId(), passCode: generatePassCode(), createdAt: new Date().toISOString() };
    const updated = [newG, ...gatePasses];
    setGatePasses(updated);
    await save(STORAGE_KEYS.gatePasses, updated);
  }

  async function addComplaint(c: Omit<Complaint, "id" | "ticketNo" | "status" | "createdAt" | "updatedAt" | "comments"> & { status?: ComplaintStatus }) {
    const now = new Date().toISOString();
    const newC: Complaint = { status: "open", ...c, id: generateId(), ticketNo: generateTicketNo(complaints), createdAt: now, updatedAt: now, comments: [] };
    const updated = [newC, ...complaints];
    setComplaints(updated);
    await save(STORAGE_KEYS.complaints, updated);
  }

  async function updateComplaintStatus(id: string, status: ComplaintStatus, comment?: string, by?: string) {
    const now = new Date().toISOString();
    const updated = complaints.map((c) => {
      if (c.id !== id) return c;
      const comments = comment ? [...c.comments, { text: comment, by: by || "Admin", at: now }] : c.comments;
      return { ...c, status, updatedAt: now, resolvedAt: status === "resolved" ? now : c.resolvedAt, comments };
    });
    setComplaints(updated);
    await save(STORAGE_KEYS.complaints, updated);
  }

  async function addNOCRequest(n: Omit<NOCRequest, "id" | "requestDate" | "status">) {
    const newN: NOCRequest = { ...n, id: generateId(), requestDate: new Date().toISOString().split("T")[0], status: "pending" };
    const updated = [newN, ...nocRequests];
    setNocRequests(updated);
    await save(STORAGE_KEYS.nocRequests, updated);
  }

  async function updateNOCStatus(id: string, status: NOCStatus, approvedBy?: string, remarks?: string) {
    const updated = nocRequests.map((n) =>
      n.id === id ? { ...n, status, approvedBy, approvedAt: new Date().toISOString().split("T")[0], remarks } : n
    );
    setNocRequests(updated);
    await save(STORAGE_KEYS.nocRequests, updated);
  }

  async function payMaintenance(id: string, method: string) {
    const updated = maintenance.map((m) =>
      m.id === id ? { ...m, status: "paid" as MaintenanceStatus, paidDate: new Date().toISOString().split("T")[0], paymentMethod: method } : m
    );
    setMaintenance(updated);
    await save(STORAGE_KEYS.maintenance, updated);
  }

  async function addFestivalContribution(festivalId: string, contribution: Omit<Contribution, "id" | "date">) {
    const newC: Contribution = { ...contribution, id: generateId(), date: new Date().toISOString().split("T")[0] };
    const updated = festivals.map((f) =>
      f.id === festivalId
        ? { ...f, contributions: [...f.contributions, newC], collectedAmount: f.collectedAmount + contribution.amount }
        : f
    );
    setFestivals(updated);
    await save(STORAGE_KEYS.festivals, updated);
  }

  async function addFestival(f: Omit<FestivalFund, "id" | "collectedAmount" | "contributions">) {
    const newF: FestivalFund = { ...f, id: generateId(), collectedAmount: 0, contributions: [] };
    const updated = [newF, ...festivals];
    setFestivals(updated);
    await save(STORAGE_KEYS.festivals, updated);
  }

  async function rsvpMeeting(meetingId: string, flatNumber: string, attending: boolean) {
    const updated = meetings.map((m) => {
      if (m.id !== meetingId) return m;
      const rsvpYes = attending ? [...m.rsvpYes.filter((r) => r !== flatNumber), flatNumber] : m.rsvpYes.filter((r) => r !== flatNumber);
      const rsvpNo = !attending ? [...m.rsvpNo.filter((r) => r !== flatNumber), flatNumber] : m.rsvpNo.filter((r) => r !== flatNumber);
      return { ...m, rsvpYes, rsvpNo };
    });
    setMeetings(updated);
    await save(STORAGE_KEYS.meetings, updated);
  }

  async function addSocietyRegistration(s: Omit<SocietyRegistration, "id" | "appliedDate" | "status">) {
    const newS: SocietyRegistration = {
      ...s,
      id: generateId(),
      appliedDate: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    const updated = [newS, ...societies];
    setSocieties(updated);
    await save(STORAGE_KEYS.societies, updated);
  }

  async function updateSocietyStatus(id: string, status: SocietyStatus, by: string, reason?: string) {
    const today = new Date().toISOString().split("T")[0];
    const updated = societies.map((s) => {
      if (s.id !== id) return s;
      if (status === "approved") {
        return { ...s, status, approvedDate: today, approvedBy: by };
      } else {
        return { ...s, status, rejectedDate: today, rejectedBy: by, rejectionReason: reason };
      }
    });
    setSocieties(updated);
    await save(STORAGE_KEYS.societies, updated);
  }

  async function addVisitorRequest(v: Omit<VisitorRequest, "id" | "requestedAt" | "status">) {
    const newV: VisitorRequest = {
      ...v,
      id: generateId(),
      requestedAt: new Date().toISOString(),
      status: "pending",
    };
    const updated = [newV, ...visitorRequests];
    setVisitorRequests(updated);
    await save(STORAGE_KEYS.visitorRequests, updated);
  }

  async function updateVisitorRequestStatus(
    id: string,
    status: VisitorRequestStatus,
    by?: string,
    reason?: string
  ): Promise<string | null> {
    const now = new Date().toISOString();
    let gatePassCode: string | null = null;
    let updatedGatePasses = gatePasses;

    const visitor = visitorRequests.find((v) => v.id === id);
    if (!visitor) return null;

    if (status === "approved" && visitor) {
      const passCode = generatePassCode();
      gatePassCode = passCode;
      const newPass: GatePass = {
        id: generateId(),
        passCode,
        visitorName: visitor.visitorName,
        visitorPhone: visitor.visitorPhone,
        purpose: visitor.purpose,
        flatNumber: visitor.flatNumber,
        residentName: visitor.residentName,
        validFrom: visitor.expectedDate,
        validTill: visitor.expectedDate,
        status: "active",
        vehicleNumber: visitor.vehicleNumber,
        createdAt: now,
      };
      updatedGatePasses = [newPass, ...gatePasses];
      setGatePasses(updatedGatePasses);
      await save(STORAGE_KEYS.gatePasses, updatedGatePasses);

      const updatedVR = visitorRequests.map((v) =>
        v.id === id
          ? { ...v, status, approvedBy: by, approvedAt: now, gatePassId: newPass.id, gatePassCode: passCode }
          : v
      );
      setVisitorRequests(updatedVR);
      await save(STORAGE_KEYS.visitorRequests, updatedVR);
    } else {
      const updatedVR = visitorRequests.map((v) =>
        v.id === id
          ? { ...v, status, rejectedAt: now, rejectionReason: reason }
          : v
      );
      setVisitorRequests(updatedVR);
      await save(STORAGE_KEYS.visitorRequests, updatedVR);
    }

    return gatePassCode;
  }

  return (
    <DataContext.Provider value={{
      announcements, maintenance, festivals, meetings, bookings, gatePasses, members, workers, complaints, nocRequests, societies, visitorRequests,
      addAnnouncement, addMeeting, addBooking, cancelBooking, addGatePass, addComplaint, updateComplaintStatus,
      addNOCRequest, updateNOCStatus, payMaintenance, addFestivalContribution, addFestival, rsvpMeeting,
      addSocietyRegistration, updateSocietyStatus, addVisitorRequest, updateVisitorRequestStatus,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
