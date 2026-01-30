sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.View1", { // ⚠️ 记得改这里的名字
        
        onInit: function () {
            // === 模拟图中的数据 ===
            var oDashboardData = {
                // 近期申请
                recentApplications: [
                    { name: "Ahmad Zaki Bin Mohd Ali", id: "APP-2025-001", date: "2025-01-05", status: "Pending", state: "Warning" },
                    { name: "Siti Aisyah Binti Rahman", id: "APP-2025-002", date: "2025-01-05", status: "Approved", state: "Success" },
                    { name: "Muhammad Haikal", id: "APP-2025-003", date: "2025-01-04", status: "Pending", state: "Warning" },
                    { name: "Nurul Huda Binti Abdullah", id: "APP-2025-004", date: "2025-01-04", status: "Rejected", state: "Error" }
                ],
                // 维修请求
                maintenance: [
                    { issue: "Air conditioner not working", location: "Block A - 205", reporter: "Ahmad Firdaus", priority: "High", state: "Warning" },
                    { issue: "Water leakage in bathroom", location: "Block B - 310", reporter: "Siti Nurhaliza", priority: "Urgent", state: "Error" },
                    { issue: "Broken Window", location: "Block C - 105", reporter: "Muhammad Afiq", priority: "Medium", state: "Warning" }
                ],
                // 近期付款
                recentPayments: [
                    { name: "Ahmad Firdaus Bin Hassan", amount: "777.00", time: "2 hours ago", status: "Success", state: "Success" },
                    { name: "Siti Nurhaliza Binti Ahmad", amount: "777.00", time: "3 hours ago", status: "Pending", state: "Warning" },
                    { name: "Muhammad Afiq Bin Rahman", amount: "777.00", time: "1 day ago", status: "Success", state: "Success" }
                ]
            };

            var oModel = new JSONModel(oDashboardData);
            this.getView().setModel(oModel, "dashboard");
        },

        // === 路由跳转 (保持你的功能) ===
        onNavToAllocate: function() {
            this.getOwnerComponent().getRouter().navTo("allocateRoom");
        },

        onNavToView: function() {
            this.getOwnerComponent().getRouter().navTo("viewRoomAvailability");
        },

        onNavToUpdate: function() {
            this.getOwnerComponent().getRouter().navTo("updateRoomAssignment");
        }
    });
});