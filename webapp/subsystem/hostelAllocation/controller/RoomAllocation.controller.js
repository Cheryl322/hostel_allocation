sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    // ✅ 注意：这里的名字必须跟你的文件夹层级完全对应
    return Controller.extend("project1.subsystem.hostelAllocation.controller.RoomAllocation", {
        
        onInit: function () {
            var oViewModel = new JSONModel({
                menuItems: [
                    { id: "viewRoomAvailability", title: "View Room Availability", icon: "sap-icon://display" },
                    { id: "allocateRoom", title: "Allocate Room", icon: "sap-icon://add" },
                    { id: "updateRoomAssignment", title: "Update Room Assignment", icon: "sap-icon://edit" }
                ]
            });
            // 绑定 Model，并给它起个名字叫 "menu"
            this.getView().setModel(oViewModel, "menu");
        },

        onMenuItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oContext = oItem.getBindingContext("menu");
            
            if (!oContext) return;

            var sItemId = oContext.getProperty("id");
            var oRouter = this.getOwnerComponent().getRouter();

            // 跳转路由
            oRouter.navTo(sItemId); 
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        }
    });
});