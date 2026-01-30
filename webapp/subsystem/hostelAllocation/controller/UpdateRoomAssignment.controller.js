sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.UpdateRoomAssignment", {
        
        onInit: function () {
            // 1. 初始化 View Model
            var oViewModel = new JSONModel({
                studentsWithAssignment: [], 
                availableRooms: [],         
                selectedStudentId: "",
                currentRoomId: "",
                selectedNewRoomId: ""
            });
            this.getView().setModel(oViewModel, "view");

            // 2. 🔥 关键修复：监听路由匹配事件 🔥
            // 只要你从别的页面跳过来，这个函数就会触发
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("updateRoomAssignment").attachPatternMatched(this._onObjectMatched, this);
        },

        // 🔥 每次进入页面都会自动执行这个函数
        _onObjectMatched: function() {
            this._refreshForm();
        },

        // 刷新界面数据
        _refreshForm: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            if (!oMainModel) return;

            var aStudents = oMainModel.getProperty("/students") || [];
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];

            console.log("正在刷新 Update 页面，当前分配记录:", aAllocations); // 👈 方便你在控制台调试

            // 1. 筛选出“有房间”的学生 (用于下拉框)
            // 逻辑：必须在 allocations 列表里能找到这个 ID
            var aStudentsWithRoom = aStudents.filter(function(student) {
                return aAllocations.some(function(allocation) {
                    return allocation.studentId === student.id;
                });
            });

            // 2. 筛选出“还有空位”的房间
            var aAvailableRooms = aRooms.filter(function(room) {
                return room.available > 0;
            });

            // 3. 更新 View Model
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/studentsWithAssignment", aStudentsWithRoom);
            oViewModel.setProperty("/availableRooms", aAvailableRooms);
            
            // 重置输入框
            oViewModel.setProperty("/selectedStudentId", "");
            oViewModel.setProperty("/currentRoomId", "");
            oViewModel.setProperty("/selectedNewRoomId", "");
            
            this._updateConfirmButton();
        },

        // 当用户在下拉框里选了学生
        onStudentChange: function (oEvent) {
            var sStudentId = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getKey() : null;
            
            if (!sStudentId) return;

            // 查找该学生当前住哪个房间
            var oMainModel = this.getOwnerComponent().getModel();
            var aAllocations = oMainModel.getProperty("/allocations") || [];
            
            var oAllocation = aAllocations.find(function(a) { return a.studentId === sStudentId; });
            
            if (oAllocation) {
                this.getView().getModel("view").setProperty("/currentRoomId", oAllocation.roomNumber);
            }
            
            this.getView().getModel("view").setProperty("/selectedNewRoomId", "");
            this._updateConfirmButton();
        },

        onRoomChange: function () {
            this._updateConfirmButton();
        },

        _updateConfirmButton: function () {
            var oViewModel = this.getView().getModel("view");
            var sStudent = oViewModel.getProperty("/selectedStudentId");
            var sNewRoom = oViewModel.getProperty("/selectedNewRoomId");
            var sCurrentRoom = oViewModel.getProperty("/currentRoomId");

            var bEnabled = !!sStudent && !!sNewRoom && (sNewRoom !== sCurrentRoom);
            var oBtn = this.byId("confirmUpdateBtn");
            if(oBtn) oBtn.setEnabled(bEnabled);
        },

        onConfirmUpdate: function () {
            var oViewModel = this.getView().getModel("view");
            var oMainModel = this.getOwnerComponent().getModel();

            var sStudentId = oViewModel.getProperty("/selectedStudentId");
            var sNewRoomId = oViewModel.getProperty("/selectedNewRoomId");
            var sOldRoomId = oViewModel.getProperty("/currentRoomId");

            if (!sStudentId || !sNewRoomId) return;

            var aRooms = oMainModel.getProperty("/rooms");
            var aAllocations = oMainModel.getProperty("/allocations");
            var aStudents = oMainModel.getProperty("/students");

            var oNewRoom = aRooms.find(function(r) { return r.roomNumber === sNewRoomId; });
            var oOldRoom = aRooms.find(function(r) { return r.roomNumber === sOldRoomId; });
            var oStudent = aStudents.find(function(s) { return s.id === sStudentId; });

            if (oNewRoom.available <= 0) {
                MessageBox.error("目标房间已满！");
                return;
            }
            if (oStudent.gender !== oNewRoom.gender) {
                MessageBox.error("性别不匹配！");
                return;
            }

            // 执行换房
            if (oOldRoom) oOldRoom.available++; 
            oNewRoom.available--;

            var oAllocation = aAllocations.find(function(a) { return a.studentId === sStudentId; });
            if (oAllocation) {
                oAllocation.roomNumber = sNewRoomId; 
                oAllocation.timestamp = new Date();
            }

            oMainModel.setProperty("/rooms", aRooms);
            oMainModel.setProperty("/allocations", aAllocations);

            MessageToast.show("成功换房！");
            this._refreshForm();
        },

        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("roomAllocation"); 
        }
    });
});