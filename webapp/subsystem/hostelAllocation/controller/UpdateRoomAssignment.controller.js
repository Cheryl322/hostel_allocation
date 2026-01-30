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

        _refreshData: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            var aStudents = oMainModel.getProperty("/students") || [];

            var aProcessedRooms = aRooms.map(function (room) {
                var aRoomAllocations = aAllocations.filter(a => a.roomNumber === room.roomNumber);
                
                var aResidents = aRoomAllocations.map(alloc => {
                    var oStudent = aStudents.find(s => s.id === alloc.studentId);
                    return { 
                        name: oStudent ? oStudent.name : "Unknown",
                        id: oStudent ? oStudent.id : "" 
                    };
                });

                var iOccupied = aRoomAllocations.length;
                var iCapacity = parseInt(room.capacity || 4);
                
                var sStatusText = "Available";
                var iStatusColor = 8; 
                var sState = "Success";

                if (iOccupied >= iCapacity) {
                    sStatusText = "Full";
                    iStatusColor = 3; 
                    sState = "Error";
                } else if (iOccupied > 0) {
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
                selectedAction: "CheckOut",
                blocks: [
                    { key: "All", text: "All Blocks" },
                    { key: "A", text: "Block A (KTDI)" },
                    { key: "B", text: "Block B (KTC)" },
                    { key: "C", text: "Block C (KTR)" }
                ]
            });
            this.getView().setModel(oViewModel, "view");
        },

        onOpenUpdateDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var oBindingContext = oButton.getBindingContext("view");
            
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.UpdateDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this.pDialog.then(function (oDialog) {
                oDialog.setBindingContext(oBindingContext, "view");
                
                var oViewModel = this.getView().getModel("view");
                oViewModel.setProperty("/selectedAction", "CheckOut");

                this.byId("studentSelect").setSelectedKey(null);
                this.byId("actionSelect").setSelectedKey("CheckOut");
                this.byId("newRoomSelect").setSelectedKey(null);
                this.byId("datePicker").setDateValue(new Date());
                this.byId("reasonInput").setValue("");
                
                oDialog.open();
            }.bind(this));
        },

        onActionChange: function(oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel("view").setProperty("/selectedAction", sKey);
        },

        onCloseDialog: function () {
            this.pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

       // === 🔥 确认更新 (包含安全检查) 🔥 ===
        onConfirmUpdate: function () {
            var sStudentId = this.byId("studentSelect").getSelectedKey();
            var sAction = this.byId("actionSelect").getSelectedKey();
            
            if (!sStudentId) {
                MessageBox.error("Please select a resident first.");
                return;
            }

            // 获取当前房间上下文
            var oContext = this.byId("studentSelect").getBindingContext("view");
            var sCurrentRoomNumber = oContext.getProperty("roomNumber");

            var oMainModel = this.getOwnerComponent().getModel();
            var aAllocations = oMainModel.getProperty("/allocations");
            var aRooms = oMainModel.getProperty("/rooms");
            var aStudents = oMainModel.getProperty("/students"); // 获取学生列表以检查性别

            // 找到当前的分配记录
            var iAllocIndex = aAllocations.findIndex(a => a.studentId === sStudentId && a.roomNumber === sCurrentRoomNumber);
            if (iAllocIndex === -1) {
                MessageBox.error("System error: Allocation record not found.");
                return;
            }

            if (sAction === "CheckOut") {
                // ... (退房逻辑保持不变) ...
                aAllocations.splice(iAllocIndex, 1);
                
                // 记得释放当前房间的空位
                var oRoom = aRooms.find(r => r.roomNumber === sCurrentRoomNumber);
                if (oRoom) oRoom.available++;

                MessageToast.show("Check-out successful!");

            } else if (sAction === "ChangeRoom") {
                // === 🔥 换房逻辑修复 (关键部分) 🔥 ===
                var sNewRoomNumber = this.byId("newRoomSelect").getSelectedKey();
                
                if (!sNewRoomNumber) {
                    MessageBox.error("Please select a new target room.");
                    return;
                }
                if (sNewRoomNumber === sCurrentRoomNumber) {
                    MessageBox.error("Target room cannot be the same as current room.");
                    return;
                }

                // 1. 🛑 检查目标房间是否已满 (计算实际人数)
                var iTargetOccupancy = aAllocations.filter(a => a.roomNumber === sNewRoomNumber).length;
                var oNewRoom = aRooms.find(r => r.roomNumber === sNewRoomNumber);
                var iCapacity = parseInt(oNewRoom.capacity || 4);

                if (iTargetOccupancy >= iCapacity) {
                    MessageBox.error("Operation Failed: Room " + sNewRoomNumber + " is already FULL (" + iTargetOccupancy + "/" + iCapacity + ")!");
                    return;
                }

                // 2. 🛑 检查性别是否匹配
                // 获取当前要移动的学生信息
                var oStudent = aStudents.find(s => s.id === sStudentId);
                
                // 如果目标房间已经有人住了，检查里面的人是什么性别
                if (iTargetOccupancy > 0) {
                    // 随便找一个已经住在里面的人
                    var oFirstRoommateAlloc = aAllocations.find(a => a.roomNumber === sNewRoomNumber);
                    var oFirstRoommate = aStudents.find(s => s.id === oFirstRoommateAlloc.studentId);
                    
                    if (oFirstRoommate && oStudent && oFirstRoommate.gender !== oStudent.gender) {
                        MessageBox.error("Operation Failed: Gender Mismatch! Cannot assign a " + oStudent.gender + " student to a room occupied by " + oFirstRoommate.gender + " residents.");
                        return;
                    }
                } else {
                    // 如果房间是空的，检查房间本身的性别设定 (如果 rooms.json 里有 gender 字段的话)
                    if (oNewRoom.gender && oNewRoom.gender !== oStudent.gender) {
                         MessageBox.error("Operation Failed: This room is designated for " + oNewRoom.gender + " students only.");
                         return;
                    }
                }

                // ✅ 所有检查通过，执行换房
                aAllocations[iAllocIndex].roomNumber = sNewRoomNumber;
                aAllocations[iAllocIndex].timestamp = new Date();

                // 更新库存数字
                var oOldRoom = aRooms.find(r => r.roomNumber === sCurrentRoomNumber);
                if (oOldRoom) oOldRoom.available++; // 旧房空位+1
                oNewRoom.available--;               // 新房空位-1

                MessageToast.show("Room changed successfully to " + sNewRoomNumber);
            }

            // 保存并刷新
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