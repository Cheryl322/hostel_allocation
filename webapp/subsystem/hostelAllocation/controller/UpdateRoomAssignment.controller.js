sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Fragment, MessageToast, MessageBox, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.UpdateRoomAssignment", {
        
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("updateRoomAssignment").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            this._refreshData();
        },

        // === 1. 数据加载 (完全复用 Allocate 的逻辑，保证卡片显示一致) ===
        _refreshData: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            var aStudents = oMainModel.getProperty("/students") || [];

            // 算出每个房间住了谁
            var aProcessedRooms = aRooms.map(function (room) {
                var aRoomAllocations = aAllocations.filter(a => a.roomNumber === room.roomNumber);
                
                var aResidents = aRoomAllocations.map(alloc => {
                    var oStudent = aStudents.find(s => s.id === alloc.studentId);
                    return { 
                        name: oStudent ? oStudent.name : "Unknown",
                        id: oStudent ? oStudent.id : "" // 需要ID来做下拉框的Key
                    };
                });

                var iOccupied = aRoomAllocations.length;
                var iCapacity = parseInt(room.capacity || 4);
                
                var sStatusText = "Available";
                var iStatusColor = 8; // Green
                var sState = "Success";

                if (iOccupied >= iCapacity) {
                    sStatusText = "Full";
                    iStatusColor = 3; // Red
                    sState = "Error";
                } else if (iOccupied > 0) {
                     // 如果有人但没满，设为 warning 颜色
                     iStatusColor = 5; 
                     sState = "Warning";
                }

                return {
                    ...room,
                    occupied: iOccupied,
                    available: iCapacity - iOccupied,
                    occupancyPercent: (iOccupied / iCapacity) * 100,
                    residents: aResidents,
                    statusText: sStatusText,
                    statusColor: iStatusColor,
                    state: sState
                };
            });

            var oViewModel = new JSONModel({
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

        // === 2. 弹窗逻辑 ===
        onOpenUpdateDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var oBindingContext = oButton.getBindingContext("view");
            
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.UpdateDialog", // 确保文件名叫 UpdateDialog.fragment.xml
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this.pDialog.then(function (oDialog) {
                // 绑定选中的房间数据
                oDialog.setBindingContext(oBindingContext, "view");
                
                // 重置表单
                this.byId("studentSelect").setSelectedKey(null);
                this.byId("actionSelect").setSelectedKey("CheckOut"); // 默认 Check Out
                this.byId("datePicker").setDateValue(new Date());
                this.byId("reasonInput").setValue("");
                
                oDialog.open();
            }.bind(this));
        },

        onCloseDialog: function () {
            this.pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        // === 3. 确认更新 ===
        onConfirmUpdate: function () {
            var sStudentId = this.byId("studentSelect").getSelectedKey();
            var sAction = this.byId("actionSelect").getSelectedKey();
            var sReason = this.byId("reasonInput").getValue();

            if (!sStudentId) {
                MessageBox.error("Please select a resident to update.");
                return;
            }

            // 获取当前房间号
            var oDialog = this.byId("studentSelect").getParent().getParent().getParent();
            var sRoomNumber = oDialog.getBindingContext("view").getProperty("roomNumber");

            var oMainModel = this.getOwnerComponent().getModel();
            var aAllocations = oMainModel.getProperty("/allocations");
            var aRooms = oMainModel.getProperty("/rooms");

            if (sAction === "CheckOut") {
                // --- 执行退房逻辑 ---
                
                // 1. 从分配列表里删除该记录
                var iIndex = aAllocations.findIndex(a => a.studentId === sStudentId && a.roomNumber === sRoomNumber);
                if (iIndex > -1) {
                    aAllocations.splice(iIndex, 1);
                }

                // 2. 房间名额 +1
                var oRoom = aRooms.find(r => r.roomNumber === sRoomNumber);
                if (oRoom) {
                    oRoom.available++;
                }

                MessageToast.show("Check-out successful for student!");

            } else {
                // 其他逻辑暂时只是提示
                MessageToast.show("Update request submitted: " + sAction);
            }

            // 保存数据并刷新
            oMainModel.setProperty("/allocations", aAllocations);
            oMainModel.setProperty("/rooms", aRooms);
            
            this.onCloseDialog();
            this._refreshData();
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter("roomNumber", FilterOperator.Contains, sQuery));
            }
            var oGrid = this.byId("roomGrid");
            oGrid.getBinding("items").filter(aFilters);
        }
    });
});