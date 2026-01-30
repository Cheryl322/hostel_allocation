sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.RoomAllocation", {
        onInit() {
            const oViewModel = new JSONModel({
                menuItems: [
                    {
                        id: "viewRoomAvailability",
                        title: "View Room Availability",
                        description: "View current availability and occupancy status of hostel rooms",
                        icon: "sap-icon://display"
                    },
                    {
                        id: "allocateRoom",
                        title: "Allocate Room",
                        description: "Allocate an available room to student based on eligibility",
                        icon: "sap-icon://add"
                    },
                    {
                        id: "updateRoomAssignment",
                        title: "Update Room Assignment",
                        description: "Update or change an existing room assignment for a student",
                        icon: "sap-icon://edit"
                    }
                ]
            });
            this.getView().setModel(oViewModel, "menu");
        },

        onMenuItemPress(oEvent) {
            // DEBUG: Keep these logs temporarily to troubleshoot click/navigation issues
            console.log("onMenuItemPress fired", oEvent);

            // Some UI5 versions / controls may use different parameter names; try common fallbacks
            const oItem = oEvent.getParameter("listItem") || oEvent.getParameter("item") || oEvent.getSource();
            const oContext = oItem && (oItem.getBindingContext("menu") || oItem.getBindingContext());
            if (!oContext) {
                console.warn("Menu item has no binding context", oItem, oEvent.getParameters());
                return;
            }
            const sItemId = oContext.getObject().id;
            const oRouter = this.getOwnerComponent().getRouter();

            switch (sItemId) {
                case "viewRoomAvailability":
                    oRouter.navTo("viewRoomAvailability");
                    break;
                case "allocateRoom":
                    oRouter.navTo("allocateRoom");
                    break;
                case "updateRoomAssignment":
                    oRouter.navTo("updateRoomAssignment");
                    break;
                default:
                    break;
            }
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        }
    });
});