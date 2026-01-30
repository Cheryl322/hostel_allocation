sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.subsystem.hostelAllocation.controller.AllocateRoom", {
        
        onInit: function () {
            // 1. 创建一个本地 View Model 来存放下拉菜单的数据
            var oViewModel = new JSONModel({
                students: [],       // 还没分房的学生
                availableRooms: [], // 还有床位的房间
                selectedStudentId: "",
                selectedRoomId: ""
            });
            this.getView().setModel(oViewModel, "view"); // 命名为 "view" 以免和主数据冲突

            // 2. 监听主数据加载完成（防止一开始数据是空的）
            this.getOwnerComponent().getModel().dataLoaded().then(function() {
                this._refreshForm();
            }.bind(this));
        },

        // 当用户改变下拉框选择时
        onStudentChange: function () {
            this._updateConfirmButton();
        },

        onRoomChange: function () {
            this._updateConfirmButton();
        },

        // 控制按钮是否可点
        _updateConfirmButton: function () {
            var oViewModel = this.getView().getModel("view");
            var sStudent = oViewModel.getProperty("/selectedStudentId");
            var sRoom = oViewModel.getProperty("/selectedRoomId");
            
            // 只有两个都选了，按钮才变亮
            var bEnabled = !!sStudent && !!sRoom;
            
            // 假设你的 XML 里按钮 ID 是 confirmAllocateBtn
            var oBtn = this.byId("confirmAllocateBtn");
            if(oBtn) oBtn.setEnabled(bEnabled);
        },

        // 点击“确认分配”按钮
        onConfirmAllocation: function () {
            var oViewModel = this.getView().getModel("view");
            var sStudentId = oViewModel.getProperty("/selectedStudentId");
            var sRoomId = oViewModel.getProperty("/selectedRoomId");

            if (!sStudentId || !sRoomId) return;

            // --- 核心逻辑开始 (取代了 Service) ---
            var oMainModel = this.getOwnerComponent().getModel(); // 获取主数据
            var aStudents = oMainModel.getProperty("/students");
            var aRooms = oMainModel.getProperty("/rooms");
            var aAllocations = oMainModel.getProperty("/allocations") || []; // 如果没有就初始化为空数组

            // 1. 找到对应的学生和房间对象
            var oStudent = aStudents.find(function(s) { return s.id === sStudentId; });
            var oRoom = aRooms.find(function(r) { return r.roomNumber === sRoomId; });

            // 2. 逻辑检查
            if (!oStudent || !oRoom) {
                MessageBox.error("系统错误：找不到选中的学生或房间数据");
                return;
            }

            if (oRoom.available <= 0) {
                MessageBox.error("错误：该房间已满！");
                return;
            }

            // 检查性别 (非常重要!)
            if (oStudent.gender !== oRoom.gender) {
                MessageBox.error("错误：性别不匹配！该房间是 " + oRoom.gender + " 生宿舍。");
                return;
            }

            // 检查是否重复分配
            var bAlreadyAllocated = aAllocations.some(function(a) { return a.studentId === sStudentId; });
            if (bAlreadyAllocated) {
                MessageBox.error("该学生已经分配过房间了！");
                return;
            }

            // 3. 执行分配 (更新数据)
            oRoom.available--; // 房间数 -1
            
            // 添加新记录
            aAllocations.push({
                studentId: oStudent.id,
                studentName: oStudent.name,
                roomNumber: oRoom.roomNumber,
                timestamp: new Date()
            });

            // 4. 将更新后的数据写回 Model
            oMainModel.setProperty("/rooms", aRooms);
            oMainModel.setProperty("/allocations", aAllocations);

            // 5. 成功提示
            MessageToast.show("成功：已将 " + oStudent.name + " 分配到 " + oRoom.roomNumber);
            
            // 6. 刷新页面（重新过滤列表）
            this._refreshForm();
        },

        // 刷新下拉列表数据
        _refreshForm: function () {
            var oMainModel = this.getOwnerComponent().getModel();
            if (!oMainModel) return;

            var aStudents = oMainModel.getProperty("/students") || [];
            var aRooms = oMainModel.getProperty("/rooms") || [];
            var aAllocations = oMainModel.getProperty("/allocations") || [];

            // 过滤：只显示还没分配房间的学生
            // 逻辑：如果这个学生的 ID 不在 allocations 列表里，就算没分配
            var aUnassignedStudents = aStudents.filter(function(student) {
                return !aAllocations.some(function(allocation) {
                    return allocation.studentId === student.id;
                });
            });

            // 过滤：只显示还有床位的房间
            var aAvailableRooms = aRooms.filter(function(room) {
                return room.available > 0;
            });

            // 更新 View Model
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/students", aUnassignedStudents);
            oViewModel.setProperty("/availableRooms", aAvailableRooms);
            oViewModel.setProperty("/selectedStudentId", ""); // 清空选择
            oViewModel.setProperty("/selectedRoomId", "");    // 清空选择

            this._updateConfirmButton();
        },

        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteView1"); // 注意：这里通常跳回主页，确认你的主页路由名字是不是叫 RouteView1
        }
    });
});