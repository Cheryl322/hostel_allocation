# Hostel Allocation Subsystem

This subsystem implements the **Hostel Allocation Module** based on the use case specifications.

## Architecture Overview

```
Hostel Allocation Module (Subsystem)
├── Actor: Hostel/Admin Staff
├── Use Cases:
│   ├── View Room Availability
│   ├── Allocate Room
│   └── Update Room Assignment
└── Components
```

## Subsystem Structure

```
webapp/subsystem/hostelAllocation/
├── RoomAllocationService.js    # Data service & business logic
├── controller/
│   ├── RoomAllocation.controller.js         # Main menu
│   ├── ViewRoomAvailability.controller.js   # UC: View Room Availability
│   ├── AllocateRoom.controller.js           # UC: Allocate Room
│   └── UpdateRoomAssignment.controller.js   # UC: Update Room Assignment
└── view/
    ├── RoomAllocation.view.xml              # Module menu
    ├── ViewRoomAvailability.view.xml        # Room list with status
    ├── AllocateRoom.view.xml                # Allocation form
    └── UpdateRoomAssignment.view.xml       # Update form
```

## Use Case Implementation

### 1. View Room Availability
- **Flow**: Admin → Room Allocation → View Room Availability
- **Basic Path**: Displays list of rooms with occupancy/availability status
- **Alternative Path**: Shows "No room information available" when empty

### 2. Allocate Room
- **Pre-conditions**: Admin logged in, student has valid application, room data exists
- **Flow**: Select student → Select available room → Confirm
- **Post-condition**: Room assigned, occupancy updated
- **Alternative Path**: "No available room for allocation" when no rooms

### 3. Update Room Assignment
- **Pre-conditions**: Admin logged in, student has existing assignment
- **Flow**: Select student → View current room → Select new room → Confirm
- **Post-condition**: Assignment updated, occupancy adjusted
- **Alternative Path**: "Selected room is not available" when room is full

## Navigation

- **System Menu** (View1) → Room Allocation
- **Room Allocation** → View Room Availability | Allocate Room | Update Room Assignment

## Data Model

- **Rooms**: id, building, floor, capacity, occupied, status, gender
- **Students**: id, name, studentId, applicationStatus, assignedRoom, gender
