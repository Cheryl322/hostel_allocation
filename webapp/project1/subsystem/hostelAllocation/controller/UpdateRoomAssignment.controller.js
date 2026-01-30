sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../RoomAllocationService"
], (Controller, JSONModel, RoomAllocationService) => {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.UpdateRoomAssignment", {
        onInit() {
            const oService = RoomAllocationService;
            const aStudentsWithAssignment = oService.getStudentsWithAssignment();
            const aAvailableRooms = oService.getAvailableRooms();

            const oViewModel = new JSONModel({
                studentsWithAssignment: aStudentsWithAssignment,
                availableRooms: aAvailableRooms,
                selectedStudentId: "",
                currentRoomId: "",
                selectedNewRoomId: ""
            });
            this.getView().setModel(oViewModel);
        },

        onStudentChange(oEvent) {
            const sStudentId = oEvent.getParameter("selectedItem")?.getKey();
            if (!sStudentId) {
                return;
            }
            const oStudent = RoomAllocationService.getStudentsWithAssignment().find(s => s.id === sStudentId);
            const oModel = this.getView().getModel();
            oModel.setProperty("/currentRoomId", oStudent?.assignedRoom || "");
            oModel.setProperty("/selectedNewRoomId", "");
            this._updateConfirmButton();
        },

        onRoomChange() {
            this._updateConfirmButton();
        },

        _updateConfirmButton() {
            const oModel = this.getView().getModel();
            const sStudent = oModel.getProperty("/selectedStudentId");
            const sNewRoom = oModel.getProperty("/selectedNewRoomId");
            const sCurrentRoom = oModel.getProperty("/currentRoomId");
            const bEnabled = !!sStudent && !!sNewRoom && sNewRoom !== sCurrentRoom;
            this.byId("confirmUpdateBtn").setEnabled(bEnabled);
        },

        onConfirmUpdate() {
            const oModel = this.getView().getModel();
            const sStudentId = oModel.getProperty("/selectedStudentId");
            const sNewRoomId = oModel.getProperty("/selectedNewRoomId");

            if (!sStudentId || !sNewRoomId) {
                return;
            }

            const oResult = RoomAllocationService.updateRoomAssignment(sStudentId, sNewRoomId);

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
            const aStudentsWithAssignment = oService.getStudentsWithAssignment();
            const aAvailableRooms = oService.getAvailableRooms();

            this.getView().getModel().setData({
                studentsWithAssignment: aStudentsWithAssignment,
                availableRooms: aAvailableRooms,
                selectedStudentId: "",
                currentRoomId: "",
                selectedNewRoomId: ""
            });
            this.byId("confirmUpdateBtn").setEnabled(false);
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("roomAllocation");
        }
    });
});