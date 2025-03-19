const app = getApp()
const DataManager = require('../../utils/dataManager')

Page({
  data: {
    isRunning: false,
    currentMode: '专注',
    timerDisplay: '25:00',
    progressPercent: 0,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    timer: null,
    themeColors: {
      '专注': '#ff6347', // 番茄红
      '短休息': '#4CAF50', // 森林绿
      '长休息': '#2196F3'  // 天空蓝
    },
    currentThemeColor: '#ff6347',
    currentModeTheme: 'work', // 当前模式对应的主题名称
    resetAnimation: {},
    currentSessionId: '', // 当前会话ID
    sessionStartTime: 0 // 当前会话开始时间
  },

  onLoad: function() {
    this.initTimer();
    
    // 调试存储状态
    DataManager.debugStorage();
  },

  initTimer: function() {
    const settings = app.globalData.timerSettings;
    let seconds = 0;
    let modeTheme = '';
    
    switch(this.data.currentMode) {
      case '专注':
        seconds = settings.work * 60;
        modeTheme = 'work';
        break;
      case '短休息':
        seconds = settings.shortBreak * 60;
        modeTheme = 'shortBreak';
        break;
      case '长休息':
        seconds = settings.longBreak * 60;
        modeTheme = 'longBreak';
        break;
    }
    
    this.setData({
      totalSeconds: seconds,
      remainingSeconds: seconds,
      timerDisplay: this.formatTime(seconds),
      progressPercent: 0,
      isRunning: false,
      currentThemeColor: this.data.themeColors[this.data.currentMode],
      currentModeTheme: modeTheme,
      currentSessionId: '',
      sessionStartTime: 0
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
      
      // 在暂停时保存当前进度，确保即使用户只是暂停也会保存记录
      this.saveIncompleteSession();
      
      this.setData({
        isRunning: false,
        timer: null
      });
    } else {
      // 启动计时器
      const now = Date.now();
      
      // 如果是新的番茄钟会话，创建一个新的会话ID
      if (!this.data.currentSessionId) {
        this.setData({
          currentSessionId: 'session_' + now,
          sessionStartTime: now
        });
      }
      
      const timer = setInterval(() => {
        let remaining = this.data.remainingSeconds - 1;
        let progress = 100 - (remaining / this.data.totalSeconds * 100);
        
        if (remaining <= 0) {
          // 计时结束
          clearInterval(this.data.timer);
          
          // 保存完成的番茄钟记录
          this.saveCompletedSession();
          
          // 振动和提示
          wx.vibrateLong();
          wx.showToast({
            title: `${this.data.currentMode}时间结束！`,
            icon: 'success',
            duration: 2000
          });
          
          // 自动切换到下一个模式
          const nextMode = this.getNextMode();
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
  
  saveCompletedSession: function() {
    const endTime = Date.now();
    const duration = this.data.totalSeconds; // 使用总时长，因为已经完成了
    const record = {
      id: this.data.currentSessionId,
      type: this.data.currentMode,
      startTime: this.data.sessionStartTime,
      endTime: endTime,
      duration: duration,
      completed: true,
      date: this.formatDate(new Date())
    };
    
    const success = DataManager.saveRecord(record);
    
    // 若保存成功且为专注模式，显示提示
    if (success && this.data.currentMode === '专注') {
      wx.showToast({
        title: '已完成专注记录',
        icon: 'success',
        duration: 1500
      });
    }
    
    // 清除当前会话ID，准备下一个
    this.setData({
      currentSessionId: '',
      sessionStartTime: 0
    });
  },
  
  saveIncompleteSession: function() {
    if (this.data.currentSessionId && this.data.sessionStartTime > 0) {
      const endTime = Date.now();
      const duration = this.data.totalSeconds - this.data.remainingSeconds; // 已经完成的部分
      
      // 只有当实际有计时时才保存（至少1秒）
      if (duration >= 1) {
        const record = {
          id: this.data.currentSessionId,
          type: this.data.currentMode,
          startTime: this.data.sessionStartTime,
          endTime: endTime,
          duration: duration,
          completed: false,
          date: this.formatDate(new Date())
        };
        
        const success = DataManager.saveRecord(record);
        
        // 记录保存成功后给予用户提示
        if (success && this.data.currentMode === '专注') {
          wx.showToast({
            title: '已保存专注记录',
            icon: 'success',
            duration: 1000
          });
        }
      }
      
      // 清除当前会话ID
      this.setData({
        currentSessionId: '',
        sessionStartTime: 0
      });
    }
  },
  
  // 格式化日期为YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  resetTimer: function() {
    // 保存未完成的会话
    if (this.data.isRunning) {
      this.saveIncompleteSession();
    }
    
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
    // 保存未完成的会话
    if (this.data.isRunning) {
      this.saveIncompleteSession();
    }
    
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 切换到下一个模式
    const nextMode = this.getNextMode();
    this.setMode({ currentTarget: { dataset: { mode: nextMode } } });
  },
  
  getNextMode: function() {
    // 根据当前模式确定下一个模式
    if (this.data.currentMode === '专注') {
      return '短休息';
    } else if (this.data.currentMode === '短休息') {
      return '专注';
    } else {
      return '专注';
    }
  },
  
  setMode: function(e) {
    // 保存未完成的会话
    if (this.data.isRunning) {
      this.saveIncompleteSession();
    }
    
    const mode = e.currentTarget.dataset.mode;
    let modeTheme = '';
    
    switch(mode) {
      case '专注':
        modeTheme = 'work';
        break;
      case '短休息':
        modeTheme = 'shortBreak';
        break;
      case '长休息':
        modeTheme = 'longBreak';
        break;
    }
    
    this.setData({ 
      currentMode: mode,
      currentThemeColor: this.data.themeColors[mode],
      currentModeTheme: modeTheme
    });
    this.initTimer();
  },
  
  // 页面隐藏/切换到后台时
  onHide: function() {
    // 如果计时器正在运行，保存当前进度
    if (this.data.isRunning) {
      this.saveIncompleteSession();
    }
  },
  
  // 页面卸载时
  onUnload: function() {
    // 如果计时器正在运行，保存当前进度
    if (this.data.isRunning) {
      this.saveIncompleteSession();
    }
    
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  }
}) 