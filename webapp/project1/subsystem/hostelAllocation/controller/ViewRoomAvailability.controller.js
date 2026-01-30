sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../RoomAllocationService"
], (Controller, RoomAllocationService) => {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.ViewRoomAvailability", {
        onInit() {
            const oService = RoomAllocationService;
            const oRoomsModel = oService.getRoomsModel();
            this.getView().setModel(oRoomsModel);

            const oData = oRoomsModel.getData();
            const aRooms = oData?.rooms || [];
            this.byId("noDataMessage").setVisible(aRooms.length === 0);
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("roomAllocation");
        }
    });
});