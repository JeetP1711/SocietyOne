# SocietyOne — Society Management App

## Overview
A comprehensive React Native (Expo) society management application for Green Valley CHS.

## Features
1. **Role-based Login** — Admin, Secretary, Member with separate dashboards
2. **Announcements** — Create/view society notices with priority levels
3. **Maintenance AutoPay** — Monthly fees tracking, payment status per flat
4. **Festival Funds** — Fund drives, contribution tracking
5. **Meeting Scheduling** — Schedule meetings, RSVP system
6. **Amenity Booking** — Book clubhouse, gym, pool, courts
7. **Gate Pass QR** — Generate visitor gate passes with QR-like display
8. **Member & Worker Directory** — Complete profiles, searchable
9. **NOC Management** — NOC requests for rental members, approve/reject
10. **Complaint Tickets** — Raise, track, and resolve maintenance issues
11. **Multi-Society Platform** — Admin dashboard managing multiple registered societies; secretary can register new societies; approve/reject society applications
12. **Visitor Approval System** — Residents submit visitor entry requests; staff (secretary/admin) approve or deny with one tap; auto-generates gate pass code (GP-XXXX-XXXX) on approval; notification triggers on approve/reject
13. **Push Notifications** — Local notifications via expo-notifications (dynamic import for web compatibility); triggered on visitor approve/reject, new request submission

## Demo Credentials
- Admin: `admin` / `admin123`
- Secretary: `secretary` / `sec123`
- Member: `rajesh` / `pass123` (Flat A-101)
- Member: `priya` / `pass123` (Flat B-201)

## Architecture
- **Frontend**: Expo Router (React Native)
- **Backend**: Express (port 5000)
- **Storage**: AsyncStorage (local persistence)
- **State**: React Context (AuthContext, DataContext)
- **Theme**: Green (#16A34A) + Blue (#2563EB)

## File Structure
```
app/
  index.tsx          # Login screen
  _layout.tsx        # Root layout with providers
  (tabs)/            # Main tab navigation
    _layout.tsx      # Tab bar (NativeTabs/Classic)
    index.tsx        # Dashboard
    notices.tsx      # Announcements + Meetings
    services.tsx     # Services hub
    community.tsx    # Members, Complaints, NOC
    profile.tsx      # User profile
  maintenance/index.tsx
  festivals/index.tsx
  meetings/index.tsx
  bookings/index.tsx
  gatepass/index.tsx
  members/index.tsx
  complaints/index.tsx
  noc/index.tsx
context/
  AuthContext.tsx    # Auth state + demo users
  DataContext.tsx    # All app data + CRUD operations
constants/
  colors.ts          # Green/Blue theme palette
```

## Tech Stack
- Expo SDK 54
- expo-router (file-based routing)
- @tanstack/react-query
- @react-native-async-storage/async-storage
- expo-linear-gradient
- expo-haptics
- react-native-svg (QR code display)
- @expo/vector-icons
