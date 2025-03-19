App({
  onLaunch: function() {
    // 小程序启动时执行
    const timerSettings = wx.getStorageSync('timer_settings');
    if (!timerSettings) {
      // 如果没有保存过设置，使用默认值并保存
      const defaultSettings = {
        work: 25, // 专注时长（分钟）
        shortBreak: 5, // 短休息时长（分钟）
        longBreak: 15, // 长休息时长（分钟）
      };
      wx.setStorageSync('timer_settings', defaultSettings);
      this.globalData.timerSettings = defaultSettings;
    } else {
      this.globalData.timerSettings = timerSettings;
    }
  },
  globalData: {
    // 全局数据
    timerSettings: {
      work: 25, // 专注时长（分钟）
      shortBreak: 5, // 短休息时长（分钟）
      longBreak: 15, // 长休息时长（分钟）
    },
    sound: '经典铃声',
    theme: '番茄红'
  }
}) 