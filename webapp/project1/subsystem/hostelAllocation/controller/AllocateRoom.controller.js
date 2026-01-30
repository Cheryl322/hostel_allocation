sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "project1.subsystem.hostelAllocation.RoomAllocationService"
], (Controller, JSONModel, RoomAllocationService) => {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.AllocateRoom", {
        onInit() {
            const oService = RoomAllocationService;
            const oStudentsModel = oService.getStudentsModel();
            const aStudents = oService.getStudentsWithApplication().filter(s => !s.assignedRoom);
            const aAvailableRooms = oService.getAvailableRooms();

            const oViewModel = new JSONModel({
                students: aStudents,
                availableRooms: aAvailableRooms,
                selectedStudentId: "",
                selectedRoomId: ""
            });
            this.getView().setModel(oViewModel);

            this.byId("noRoomMessage").setVisible(aAvailableRooms.length === 0);
        },

        onStudentChange() {
            this._updateConfirmButton();
        },

        onRoomChange() {
            this._updateConfirmButton();
        },

        _updateConfirmButton() {
            const oModel = this.getView().getModel();
            const sStudent = oModel.getProperty("/selectedStudentId");
            const sRoom = oModel.getProperty("/selectedRoomId");
            this.byId("confirmAllocateBtn").setEnabled(!!sStudent && !!sRoom);
        },

        onConfirmAllocation() {
            const oModel = this.getView().getModel();
            const sStudentId = oModel.getProperty("/selectedStudentId");
            const sRoomId = oModel.getProperty("/selectedRoomId");

            if (!sStudentId || !sRoomId) {
                return;
            }

            const oResult = RoomAllocationService.allocateRoom(sStudentId, sRoomId);

            if (oResult.success) {
                this.byId("successMessage").setVisible(true);
                this.byId("successMessage").setText(oResult.message);
                this._refreshForm();
            } else {
                sap.m.MessageBox.error(oResult.message);
            }
        },

        _refreshForm() {
            const oService = RoomAllocationService;
            const aStudents = oService.getStudentsWithApplication().filter(s => !s.assignedRoom);
            const aAvailableRooms = oService.getAvailableRooms();

            this.getView().getModel().setData({
                students: aStudents,
                availableRooms: aAvailableRooms,
                selectedStudentId: "",
                selectedRoomId: ""
            });
            this.byId("confirmAllocateBtn").setEnabled(false);
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("roomAllocation");
        }
    });
});