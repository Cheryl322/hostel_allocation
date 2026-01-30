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

        _refreshData: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            var aStudents = oMainModel.getProperty("/students") || [];

            // 1. 🔥 关键新增：筛选出“还没有房间”的学生 🔥
            var aAvailableStudents = aStudents.filter(function(student) {
                // 如果这个学生ID不存在于 allocations 数组里，保留他
                return !aAllocations.some(function(allocation) {
                    return allocation.studentId === student.id;
                });
            });

            // 2. 处理房间数据 (保持原样)
            var aProcessedRooms = aRooms.map(function (room) {
                var aRoomAllocations = aAllocations.filter(a => a.roomNumber === room.roomNumber);
                
                var aResidents = aRoomAllocations.map(alloc => {
                    var oStudent = aStudents.find(s => s.id === alloc.studentId);
                    return { name: oStudent ? oStudent.name : "Unknown" };
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

            // 3. 将筛选后的 availableStudents 放入 View Model
            var oViewModel = new JSONModel({
                roomsWithResidents: aProcessedRooms,
                availableStudents: aAvailableStudents, // 👈 这一步很重要
                blocks: [
                    { key: "All", text: "All Blocks" },
                    { key: "A", text: "Block A (KTDI)" },
                    { key: "B", text: "Block B (KTC)" },
                    { key: "C", text: "Block C (KTR)" }
                ]
            });
            this.getView().setModel(oViewModel, "view");
        },

        // === 弹窗逻辑 ===
        // === 弹窗逻辑：智能过滤性别 ===
        onOpenAllocateDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var oBindingContext = oButton.getBindingContext("view");
            var oRoomData = oBindingContext.getObject(); // 获取当前房间的所有数据
            
            // 1. 获取房间性别 (假设数据里有 gender: "Male" 或 "Female")
            var sRoomGender = oRoomData.gender; 

            // 2. 获取所有“未分配”的学生 (我们在 _refreshData 里算出来的)
            var oViewModel = this.getView().getModel("view");
            var aAllAvailable = oViewModel.getProperty("/availableStudents");

            // 3. 🔥 核心逻辑：过滤性别 🔥
            var aFilteredStudents = aAllAvailable; // 默认显示所有人
            
            if (sRoomGender) {
                // 如果房间规定了性别，就只显示对应性别的学生
                aFilteredStudents = aAllAvailable.filter(function(student) {
                    return student.gender === sRoomGender;
                });
            }

            // 4. 把过滤后的名单存回 Model，专门给 Dialog 用
            oViewModel.setProperty("/dialogStudents", aFilteredStudents);

            // 加载弹窗
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.AllocateDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this.pDialog.then(function (oDialog) {
                oDialog.setBindingContext(oBindingContext, "view");
                
                // 清空表单
                this.byId("studentInput").setSelectedKey(null);
                this.byId("dateInput").setDateValue(new Date());
                this.byId("remarksInput").setValue("");
                
                oDialog.open();
            }.bind(this));
        }, 

        onCloseDialog: function () {
            this.byId("studentInput").setValue(""); 
            this.pDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onConfirmDialog: function () {
            var sStudentKey = this.byId("studentInput").getSelectedKey();
            var oDate = this.byId("dateInput").getDateValue();

            if (!sStudentKey) {
                MessageBox.error("Please select a student.");
                return;
            }

            // 获取上下文
            var oContext = this.byId("studentInput").getBindingContext("view");
            var oRoomData = oContext.getObject();

            var oMainModel = this.getOwnerComponent().getModel();
            var aAllocations = oMainModel.getProperty("/allocations");
            var aRooms = oMainModel.getProperty("/rooms");

            // 双重检查：防止同一个人被分两次
            var bAlreadyAssigned = aAllocations.some(a => a.studentId === sStudentKey);
            if (bAlreadyAssigned) {
                MessageBox.error("This student already has a room!");
                return;
            }

            // 更新房间名额
            var oRoom = aRooms.find(r => r.roomNumber === oRoomData.roomNumber);
            if (oRoom) {
                oRoom.available--; 
            }

            var aStudents = oMainModel.getProperty("/students");
            var oStudent = aStudents.find(s => s.id === sStudentKey);

            // 添加记录
            aAllocations.push({
                studentId: sStudentKey,
                studentName: oStudent.name,
                roomNumber: oRoomData.roomNumber,
                date: oDate,
                timestamp: new Date()
            });

            oMainModel.setProperty("/rooms", aRooms);
            oMainModel.setProperty("/allocations", aAllocations);

            MessageToast.show("Room Allocated Successfully!");
            
            this.onCloseDialog();
            this._refreshData(); // 🔥 这里刷新后，availableStudents 会重新计算，刚才那个人就会消失
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