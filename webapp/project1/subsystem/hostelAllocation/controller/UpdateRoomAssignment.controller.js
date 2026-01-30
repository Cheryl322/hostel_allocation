sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    // ✅ 名字是对的 (长路径)
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

            // 2. 等待主数据加载完再刷新列表
            this.getOwnerComponent().getModel().dataLoaded().then(function() {
                this._refreshForm();
            }.bind(this));
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

            // 验证
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

        _refreshForm: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            if (!oMainModel) return;

            var aStudents = oMainModel.getProperty("/students") || [];
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];

            // 筛选出有房间的学生
            var aStudentsWithRoom = aStudents.filter(function(student) {
                return aAllocations.some(function(allocation) {
                    return allocation.studentId === student.id;
                });
            });

            // 筛选出有空位的房间
            var aAvailableRooms = aRooms.filter(function(room) {
                return room.available > 0;
            });

            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/studentsWithAssignment", aStudentsWithRoom);
            oViewModel.setProperty("/availableRooms", aAvailableRooms);
            
            oViewModel.setProperty("/selectedStudentId", "");
            oViewModel.setProperty("/currentRoomId", "");
            oViewModel.setProperty("/selectedNewRoomId", "");
            
            this._updateConfirmButton();
        },

        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            // 这里跳回菜单页 (TargetRoomAllocation)
            oRouter.navTo("roomAllocation"); 
        }
    });
});