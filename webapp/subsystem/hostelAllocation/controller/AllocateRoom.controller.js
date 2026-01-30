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

    return Controller.extend("project1.subsystem.hostelAllocation.controller.AllocateRoom", {
        
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("allocateRoom").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            this._refreshData();
        },

        // === 1. 数据准备逻辑 (和 ViewRoomAvailability 类似) ===
        _refreshData: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            var aStudents = oMainModel.getProperty("/students") || [];

            // 处理房间数据，塞入住户信息
            var aProcessedRooms = aRooms.map(function (room) {
                var aRoomAllocations = aAllocations.filter(a => a.roomNumber === room.roomNumber);
                
                var aResidents = aRoomAllocations.map(alloc => {
                    var oStudent = aStudents.find(s => s.id === alloc.studentId);
                    return { name: oStudent ? oStudent.name : "Unknown" };
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
                }

                return {
                    ...room, // 保留原有的 block, building 等信息
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

        // === 2. 弹窗逻辑 (Fragment) ===
        
        onOpenAllocateDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var oBindingContext = oButton.getBindingContext("view"); // 获取被点击卡片的数据
            
            // 加载 Fragment
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.AllocateDialog", // ⚠️ 确保路径对：view文件夹下的AllocateDialog.fragment.xml
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this.pDialog.then(function (oDialog) {
                // 将弹窗绑定到被点击的房间数据上 (这样顶部蓝框才会显示 Room 104)
                oDialog.setBindingContext(oBindingContext, "view");
                
                // 清空表单
                this.byId("studentInput").setSelectedKey(null);
                this.byId("dateInput").setValue(new Date()); // 默认今天
                this.byId("remarksInput").setValue("");
                
                oDialog.open();
            }.bind(this));
        },

        onCloseDialog: function () {
            this.byId("studentInput").setValue(""); // Clear input
            this.pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        // === 3. 确认分配 (Save) ===
        onConfirmDialog: function () {
            // 1. 获取输入数据
            var sStudentKey = this.byId("studentInput").getSelectedKey();
            var oDate = this.byId("dateInput").getDateValue();

            if (!sStudentKey) {
                MessageBox.error("Please select a student.");
                return;
            }

            // 2. 获取当前房间信息 (从弹窗的 Context 获取)
            var oDialog = this.byId("studentInput").getParent().getParent().getParent(); // 笨办法找Dialog，或者直接用绑定的Context
            // 更好的方法：
            var oContext = this.pDialog.then(async (oDialog) => {
                 var oRoomData = oDialog.getBindingContext("view").getObject();
                 
                 // 3. 开始保存
                 var oMainModel = this.getOwnerComponent().getModel();
                 var aAllocations = oMainModel.getProperty("/allocations");
                 var aRooms = oMainModel.getProperty("/rooms");

                 // 检查学生是否已经有房间了
                 var bAlreadyAssigned = aAllocations.some(a => a.studentId === sStudentKey);
                 if (bAlreadyAssigned) {
                     MessageBox.error("This student already has a room!");
                     return;
                 }

                 // 更新主数据
                 var oRoom = aRooms.find(r => r.roomNumber === oRoomData.roomNumber);
                 if (oRoom) {
                     oRoom.available--; 
                 }

                 var aStudents = oMainModel.getProperty("/students");
                 var oStudent = aStudents.find(s => s.id === sStudentKey);

                 aAllocations.push({
                     studentId: sStudentKey,
                     studentName: oStudent.name,
                     roomNumber: oRoomData.roomNumber,
                     date: oDate,
                     timestamp: new Date()
                 });

                 // 保存回 Model
                 oMainModel.setProperty("/rooms", aRooms);
                 oMainModel.setProperty("/allocations", aAllocations);

                 MessageToast.show("Room Allocated Successfully!");
                 
                 // 关闭弹窗并刷新
                 oDialog.close();
                 this._refreshData();
            });
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