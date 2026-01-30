sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "project1/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/base/util/UriParameters"
], function (UIComponent, Device, models, JSONModel, UriParameters) {
    "use strict";

    return UIComponent.extend("project1.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            // 1. 调用父类初始化
            UIComponent.prototype.init.apply(this, arguments);

            // 2. 初始化路由
            this.getRouter().initialize();

            // 3. 设置设备模型
            this.setModel(models.createDeviceModel(), "device");

            // --- 🔥 核心修复：路径更新 🔥 ---
            var oModel = new JSONModel();
            
            // 使用 sap.ui.require.toUrl 确保能正确找到文件夹
            // 假设你的 Namespace 是 project1
            var sStudentPath = sap.ui.require.toUrl("project1/model/mockData/students.json"); 
            // ⚠️ 注意：我写的是 students.json (复数)，如果你的文件是 student.json (单数)，请这里删掉 s
            
            var sRoomPath = sap.ui.require.toUrl("project1/model/mockData/rooms.json");

            // 加载数据
            Promise.all([
                jQuery.ajax(sStudentPath),
                jQuery.ajax(sRoomPath)
            ]).then(function(results) {
                var aStudents = results[0]; 
                var aRooms = results[1];    

                // 修正数据结构 (防止 json 里面包了一层 { "students": [...] })
                if (aStudents.students) aStudents = aStudents.students;
                if (aRooms.rooms) aRooms = aRooms.rooms;

                // 拼装大模型
                var oFullData = {
                    students: aStudents,
                    rooms: aRooms,
                    allocations: [] 
                };

                oModel.setData(oFullData);
                console.log("✅ 数据加载成功!", oFullData);
            }).catch(function(err) {
                console.error("❌ 数据加载失败！请检查文件名和路径。", err);
                console.log("尝试加载的路径:", sStudentPath, sRoomPath);
            });

            // 将这个模型设为“默认模型”
            this.setModel(oModel);
        }
    });
});