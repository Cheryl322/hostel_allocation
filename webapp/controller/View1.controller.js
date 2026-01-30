sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        
        onInit: function () {
            // === Dashboard 模拟数据 ===
            var oDashboardData = {
                // 顶部统计
                statistics: {
                    pendingApps: 45,
                    maintenance: 23,
                    occupied: 1092,
                    revenue: "970k"
                },
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
                    { name: "Siti Nurhaliza Binti Ahmad", amount: "777.00", time: "3 hours ago", status: "Pending", state: "Warning" }
                ]
            };

            var oModel = new JSONModel(oDashboardData);
            this.getView().setModel(oModel, "dashboard");
        },

        // =========================================================
        // 👇👇👇 你的问题通常是因为缺了下面这三个函数 👇👇👇
        // =========================================================

        onNavToAllocate: function() {
            // 必须与 manifest.json 里的 route name 一致 ("allocateRoom")
            this.getOwnerComponent().getRouter().navTo("allocateRoom");
        },

        onNavToView: function() {
            // 必须与 manifest.json 里的 route name 一致 ("viewRoomAvailability")
            this.getOwnerComponent().getRouter().navTo("viewRoomAvailability");
        },

        onNavToUpdate: function() {
            // 必须与 manifest.json 里的 route name 一致 ("updateRoomAssignment")
            this.getOwnerComponent().getRouter().navTo("updateRoomAssignment");
        }
    });
});