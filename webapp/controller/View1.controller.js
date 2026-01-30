sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        
        onInit: function () {
            // === 1. 准备 Dashboard 的模拟数据 ===
            // 这些数据是为了配合 View1.view.xml 里的绑定显示用的
            var oDashboardData = {
                // 顶部统计数字
                statistics: {
                    pendingApps: 45,
                    maintenance: 23,
                    occupied: 1092,
                    revenue: "970k"
                },
                // 近期申请列表 (左栏)
                recentApplications: [
                    { name: "Ahmad Zaki", id: "APP-001", date: "2025-01-05", status: "Pending", state: "Warning" },
                    { name: "Siti Aisyah", id: "APP-002", date: "2025-01-05", status: "Approved", state: "Success" },
                    { name: "Muhammad Haikal", id: "APP-003", date: "2025-01-04", status: "Pending", state: "Warning" },
                    { name: "Nurul Huda", id: "APP-004", date: "2025-01-04", status: "Rejected", state: "Error" },
                    { name: "Lee Wei Kang", id: "APP-005", date: "2025-01-03", status: "Approved", state: "Success" }
                ],
                // 维修请求列表 (右栏)
                maintenance: [
                    { issue: "Air conditioner not working", location: "Block A - 205", priority: "High", state: "Warning" },
                    { issue: "Water leakage in bathroom", location: "Block B - 310", priority: "Urgent", state: "Error" },
                    { issue: "Broken Window", location: "Block C - 105", priority: "Medium", state: "None" },
                    { issue: "Light bulb replacement", location: "Block A - 401", priority: "Low", state: "Success" }
                ]
            };

            // 创建一个 JSON Model，并命名为 "dashboard"
            // 这样你在 XML 里就可以用 {dashboard>/recentApplications} 来绑定数据了
            var oModel = new JSONModel(oDashboardData);
            this.getView().setModel(oModel, "dashboard");
        },

        // === 2. 头部磁贴点击事件 (可选) ===
        onPress: function (oEvent) {
            MessageToast.show("点击了统计卡片 (演示功能)");
        },

        // === 3. 路由跳转功能 (连接到你之前的页面) ===
        
        // 跳转到 Allocate Room 页面
        onNavToAllocate: function() {
            this.getOwnerComponent().getRouter().navTo("allocateRoom");
        },

        // 跳转到 View Availability 页面
        onNavToView: function() {
            this.getOwnerComponent().getRouter().navTo("viewRoomAvailability");
        },

        // 跳转到 Update Assignment 页面
        onNavToUpdate: function() {
            this.getOwnerComponent().getRouter().navTo("updateRoomAssignment");
        }
    });
});