App({
  onLaunch: function() {
    // 小程序启动时执行
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