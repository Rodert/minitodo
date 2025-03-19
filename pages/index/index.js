const app = getApp()

Page({
  data: {
    isRunning: false,
    currentMode: '专注',
    timerDisplay: '25:00',
    progressPercent: 0,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    timer: null
  },

  onLoad: function() {
    this.initTimer();
  },

  initTimer: function() {
    const settings = app.globalData.timerSettings;
    let seconds = 0;
    
    switch(this.data.currentMode) {
      case '专注':
        seconds = settings.work * 60;
        break;
      case '短休息':
        seconds = settings.shortBreak * 60;
        break;
      case '长休息':
        seconds = settings.longBreak * 60;
        break;
    }
    
    this.setData({
      totalSeconds: seconds,
      remainingSeconds: seconds,
      timerDisplay: this.formatTime(seconds),
      progressPercent: 0,
      isRunning: false
    });
    
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },
  
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  toggleTimer: function() {
    if (this.data.isRunning) {
      // 暂停计时器
      clearInterval(this.data.timer);
      this.setData({
        isRunning: false,
        timer: null
      });
    } else {
      // 启动计时器
      const timer = setInterval(() => {
        let remaining = this.data.remainingSeconds - 1;
        let progress = 100 - (remaining / this.data.totalSeconds * 100);
        
        if (remaining <= 0) {
          // 计时结束
          clearInterval(this.data.timer);
          wx.vibrateLong();
          wx.showToast({
            title: `${this.data.currentMode}时间结束！`,
            icon: 'success',
            duration: 2000
          });
          
          // 自动切换到下一个模式
          const nextMode = this.data.currentMode === '专注' ? '短休息' : '专注';
          this.setMode({ currentTarget: { dataset: { mode: nextMode } } });
          return;
        }
        
        this.setData({
          remainingSeconds: remaining,
          timerDisplay: this.formatTime(remaining),
          progressPercent: progress
        });
      }, 1000);
      
      this.setData({
        isRunning: true,
        timer: timer
      });
    }
  },
  
  resetTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    this.initTimer();
    
    // 添加旋转动画效果
    const animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    });
    animation.rotate(360).step();
    this.setData({
      resetAnimation: animation.export()
    });
    
    setTimeout(() => {
      animation.rotate(0).step({ duration: 0 });
      this.setData({
        resetAnimation: animation.export()
      });
    }, 500);
  },
  
  skipTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 切换到下一个模式
    const nextMode = this.data.currentMode === '专注' ? '短休息' : '专注';
    this.setMode({ currentTarget: { dataset: { mode: nextMode } } });
  },
  
  setMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ currentMode: mode });
    this.initTimer();
  }
}) 