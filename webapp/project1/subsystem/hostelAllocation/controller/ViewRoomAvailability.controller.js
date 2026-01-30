sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    // ✅ 这里的名字是对的，保留长路径
    return Controller.extend("project1.subsystem.hostelAllocation.controller.ViewRoomAvailability", {
        
        onInit: function () {
            // 我们不需要专门 setModel，因为 View 会自动继承 Component 的主模型 (localData)
            
            // 下面的逻辑是为了检查“如果没有房间数据，就显示提示信息”
            var oModel = this.getOwnerComponent().getModel();
            
            if (oModel) {
                // 等待数据加载完成（防止一开始数据还没读进来）
                oModel.dataLoaded().then(function() {
                    var aRooms = oModel.getProperty("/rooms") || [];
                    var oNoDataMsg = this.byId("noDataMessage");
                    
                    // 如果 XML 里真的有这个 ID 为 noDataMessage 的控件，才执行
                    if (oNoDataMsg) {
                        oNoDataMsg.setVisible(aRooms.length === 0);
                    }
                }.bind(this));
            }
        },

        onNavBack: function () {
            // 返回上一级菜单
            this.getOwnerComponent().getRouter().navTo("roomAllocation");
        }
    });
});