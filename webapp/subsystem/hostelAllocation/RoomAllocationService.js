sap.ui.define([
    "sap/ui/model/json/JSONModel"
], (JSONModel) => {
    "use strict";

    const MOCK_ROOMS = {
        rooms: [
            { id: "R001", building: "Block A", floor: 1, capacity: 2, occupied: 1, status: "Available", gender: "Male" },
            { id: "R002", building: "Block A", floor: 1, capacity: 2, occupied: 2, status: "Full", gender: "Male" },
            { id: "R003", building: "Block A", floor: 2, capacity: 2, occupied: 0, status: "Available", gender: "Female" },
            { id: "R004", building: "Block B", floor: 1, capacity: 2, occupied: 1, status: "Available", gender: "Male" },
            { id: "R005", building: "Block B", floor: 2, capacity: 2, occupied: 0, status: "Available", gender: "Female" }
        ]
    };

    const MOCK_STUDENTS = {
        students: [
            { id: "S001", name: "Ahmad bin Ali", studentId: "2024001", applicationStatus: "Approved", assignedRoom: "R001", gender: "Male" },
            { id: "S002", name: "Siti Nurhaliza", studentId: "2024002", applicationStatus: "Approved", assignedRoom: null, gender: "Female" },
            { id: "S003", name: "Muhammad Hafiz", studentId: "2024003", applicationStatus: "Approved", assignedRoom: "R004", gender: "Male" }
        ]
    };

    const RoomAllocationService = {
        _roomsModel: null,
        _studentsModel: null,

        getRoomsModel() {
            if (!this._roomsModel) {
                this._roomsModel = new JSONModel(MOCK_ROOMS);
            }
            return this._roomsModel;
        },

        getStudentsModel() {
            if (!this._studentsModel) {
                this._studentsModel = new JSONModel(MOCK_STUDENTS);
            }
            return this._studentsModel;
        },

        getAvailableRooms() {
            const oData = this.getRoomsModel().getData();
            return (oData.rooms || []).filter(r => r.status === "Available");
        },

        getRoomById(sRoomId) {
            const oData = this.getRoomsModel().getData();
            return (oData.rooms || []).find(r => r.id === sRoomId);
        },

        getStudentsWithApplication() {
            const oData = this.getStudentsModel().getData();
            return (oData.students || []).filter(s => s.applicationStatus === "Approved");
        },

        getStudentsWithAssignment() {
            const oData = this.getStudentsModel().getData();
            return (oData.students || []).filter(s => s.assignedRoom);
        },

        allocateRoom(sStudentId, sRoomId) {
            const oRoomsData = this.getRoomsModel().getData();
            const oStudentsData = this.getStudentsModel().getData();
            const oRoom = (oRoomsData.rooms || []).find(r => r.id === sRoomId);
            const oStudent = (oStudentsData.students || []).find(s => s.id === sStudentId);

            if (!oRoom || oRoom.status !== "Available") {
                return { success: false, message: "No available room for allocation." };
            }
            if (!oStudent) {
                return { success: false, message: "Student not found." };
            }

            oRoom.occupied = (oRoom.occupied || 0) + 1;
            oRoom.status = oRoom.occupied >= oRoom.capacity ? "Full" : "Available";
            oStudent.assignedRoom = sRoomId;

            this.getRoomsModel().refresh(true);
            this.getStudentsModel().refresh(true);
            return { success: true, message: "Room allocated successfully." };
        },

        updateRoomAssignment(sStudentId, sNewRoomId) {
            const oRoomsData = this.getRoomsModel().getData();
            const oStudentsData = this.getStudentsModel().getData();
            const oNewRoom = (oRoomsData.rooms || []).find(r => r.id === sNewRoomId);
            const oStudent = (oStudentsData.students || []).find(s => s.id === sStudentId);
            const sOldRoomId = oStudent?.assignedRoom;

            if (!oNewRoom || oNewRoom.status === "Full") {
                return { success: false, message: "Selected room is not available." };
            }
            if (!oStudent || !sOldRoomId) {
                return { success: false, message: "Student has no existing assignment." };
            }

            const oOldRoom = (oRoomsData.rooms || []).find(r => r.id === sOldRoomId);
            if (oOldRoom) {
                oOldRoom.occupied = Math.max(0, (oOldRoom.occupied || 1) - 1);
                oOldRoom.status = oOldRoom.occupied < oOldRoom.capacity ? "Available" : "Full";
            }

            oNewRoom.occupied = (oNewRoom.occupied || 0) + 1;
            oNewRoom.status = oNewRoom.occupied >= oNewRoom.capacity ? "Full" : "Available";
            oStudent.assignedRoom = sNewRoomId;

            this.getRoomsModel().refresh(true);
            this.getStudentsModel().refresh(true);
            return { success: true, message: "Room assignment updated successfully." };
        }
    };

    return RoomAllocationService;
});
