sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.AllocateRoom", {
        
        onInit: function () {
            // View Model 用于绑定下拉框的选择状态
            var oViewModel = new JSONModel({
                selectedStudentId: "",
                selectedRoomId: ""
            });
            this.getView().setModel(oViewModel, "view");

            // 等待主数据加载 (students/rooms)
            this.getOwnerComponent().getModel().dataLoaded().then(function() {
                this._refreshForm();
            }.bind(this));
        },

        onStudentChange: function () {
            this._updateConfirmButton();
        },

        onRoomChange: function () {
            this._updateConfirmButton();
        },

        _updateConfirmButton: function () {
            var oViewModel = this.getView().getModel("view");
            var sStudent = oViewModel.getProperty("/selectedStudentId");
            var sRoom = oViewModel.getProperty("/selectedRoomId");
            this.byId("confirmAllocateBtn").setEnabled(!!sStudent && !!sRoom);
        },

        // 🔥 核心保存逻辑 🔥
        onConfirmAllocation: function () {
            var oViewModel = this.getView().getModel("view");
            var sStudentId = oViewModel.getProperty("/selectedStudentId");
            var sRoomId = oViewModel.getProperty("/selectedRoomId");

            if (!sStudentId || !sRoomId) return;

            // 1. 获取主模型 (这是所有页面共享数据的唯一地方)
            var oMainModel = this.getOwnerComponent().getModel(); 
            var aStudents = oMainModel.getProperty("/students");
            var aRooms = oMainModel.getProperty("/rooms");
            var aAllocations = oMainModel.getProperty("/allocations") || []; // 确保有这个数组

            // 2. 找到对应数据对象
            var oStudent = aStudents.find(function(s) { return s.id === sStudentId; });
            var oRoom = aRooms.find(function(r) { return r.roomNumber === sRoomId; });

            // 3. 校验逻辑
            if (oRoom.available <= 0) {
                MessageBox.error("该房间已满！");
                return;
            }

            // 4. 📝 真正写入数据 (这一步至关重要！)
            
            // 扣减房间名额
            oRoom.available--; 

            // 添加分配记录到共享数组
            aAllocations.push({
                studentId: oStudent.id,
                studentName: oStudent.name,
                roomNumber: oRoom.roomNumber,
                timestamp: new Date()
            });

            // 5. 保存回主模型 (Update页面是读这里的！)
            oMainModel.setProperty("/rooms", aRooms);
            oMainModel.setProperty("/allocations", aAllocations);

            // 6. 界面反馈
            // 隐藏旧的 MessageStrip (如果你 XML 里还有的话)
            if(this.byId("successMessage")) this.byId("successMessage").setVisible(false);
            
            // 使用 MessageToast 提示
            MessageToast.show("分配成功！数据已保存。");
            
            // 7. 刷新当前页面 (移除已分配的学生)
            this._refreshForm();
        },

        _refreshForm: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            if (!oMainModel) return;

            var aStudents = oMainModel.getProperty("/students") || [];
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];

            // 过滤掉已经有房间的学生
            var aUnassignedStudents = aStudents.filter(function(student) {
                return !aAllocations.some(function(allocation) {
                    return allocation.studentId === student.id;
                });
            });

            // 过滤掉已满的房间
            var aAvailableRooms = aRooms.filter(function(room) {
                return room.available > 0;
            });

            // 更新 View Model 供 XML 显示
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/students", aUnassignedStudents);
            oViewModel.setProperty("/availableRooms", aAvailableRooms);
            
            // 清空选择
            oViewModel.setProperty("/selectedStudentId", "");
            oViewModel.setProperty("/selectedRoomId", "");
            this._updateConfirmButton();
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("roomAllocation");
        }
    });
});