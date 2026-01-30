sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.ViewRoomAvailability", { // ⚠️ 记得确认这里的名字
        
        onInit: function () {
            // 监听路由，每次进入页面都刷新数据
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("viewRoomAvailability").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            this._refreshData();
        },

        _refreshData: function () {
            // 1. 获取主数据
            var oMainModel = this.getOwnerComponent().getModel();
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            var aStudents = oMainModel.getProperty("/students") || [];

            // 2. 准备统计变量
            var iTotalRooms = aRooms.length;
            var iOccupiedRooms = 0;
            var iTotalCapacity = 0;
            var iTotalOccupiedBeds = 0;

            // 3. 处理房间数据 (把住户名字塞进去)
            var aProcessedRooms = aRooms.map(function (room) {
                // 找出住在该房间的所有分配记录
                var aRoomAllocations = aAllocations.filter(function (a) {
                    return a.roomNumber === room.roomNumber;
                });

                // 获取住户详情
                var aResidents = aRoomAllocations.map(function (allocation) {
                    var oStudent = aStudents.find(function (s) { return s.id === allocation.studentId; });
                    return {
                        name: oStudent ? oStudent.name : "Unknown Student",
                        id: allocation.studentId
                    };
                });

                // 计算当前房间状态
                var iOccupied = aRoomAllocations.length; // 实时计算占用人数
                var iCapacity = parseInt(room.capacity || 4); // 默认容量4
                var fPercent = (iOccupied / iCapacity) * 100;
                
                // 统计累加
                if (iOccupied > 0) iOccupiedRooms++;
                iTotalCapacity += iCapacity;
                iTotalOccupiedBeds += iOccupied;

                // 判断状态颜色和文字
                var sStatusText = "Available";
                var iStatusColor = 8; // Green
                var sState = "Success";

                if (iOccupied >= iCapacity) {
                    sStatusText = "Full";
                    iStatusColor = 3; // Red
                    sState = "Error";
                } else if (iOccupied > 0) {
                    sStatusText = "Partially Occupied";
                    iStatusColor = 5; // Blue
                    sState = "Warning";
                }

                // 返回增强后的房间对象
                return {
                    roomNumber: room.roomNumber,
                    block: room.block || "A", // 假设字段
                    building: room.building || "KTDI", // 假设字段
                    floor: room.floor || 1,
                    capacity: iCapacity,
                    occupied: iOccupied,
                    occupancyPercent: fPercent,
                    residents: aResidents, // 👈 这一步很关键！
                    statusText: sStatusText,
                    statusColor: iStatusColor,
                    state: sState
                };
            });

            // 4. 计算最终统计数据
            var iAvailableRooms = iTotalRooms - iOccupiedRooms;
            var fOccupancyRate = iTotalRooms > 0 ? ((iOccupiedRooms / iTotalRooms) * 100).toFixed(1) : 0;

            // 5. 绑定到 View Model
            var oViewModel = new JSONModel({
                stats: {
                    totalRooms: iTotalRooms,
                    availableRooms: iAvailableRooms,
                    occupiedRooms: iOccupiedRooms,
                    occupancyRate: fOccupancyRate
                },
                roomsWithResidents: aProcessedRooms,
                blocks: [
                    { key: "All", text: "All Blocks" },
                    { key: "A", text: "Block A (KTDI)" },
                    { key: "B", text: "Block B (KTC)" },
                    { key: "C", text: "Block C (KTR)" }
                ]
            });

            this.getView().setModel(oViewModel, "view");
        },

        // 搜索功能
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var aFilters = [];
            
            if (sQuery && sQuery.length > 0) {
                // 搜索房间号
                aFilters.push(new Filter("roomNumber", FilterOperator.Contains, sQuery));
            }

            var oGrid = this.byId("roomGrid");
            var oBinding = oGrid.getBinding("items");
            oBinding.filter(aFilters);
        },

        // 筛选 Block 功能
        onFilterBlock: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var aFilters = [];

            if (sKey !== "All") {
                aFilters.push(new Filter("block", FilterOperator.EQ, sKey));
            }

            var oGrid = this.byId("roomGrid");
            var oBinding = oGrid.getBinding("items");
            oBinding.filter(aFilters);
        }
    });
});