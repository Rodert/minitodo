const DataManager = require('../../utils/dataManager');

Page({
  data: {
    currentPeriod: '周',
    chartData: [],
    summaryData: {
      count: 0,
      hours: 0,
      rate: '0%'
    },
    focusRecords: [], // 存储当前时间维度下的专注记录列表
    showRecordsList: false // 控制是否显示记录列表
  },

  onLoad: function() {
    console.log('统计页面初始化');
    this.loadStatisticsData();
    
    // 调试存储
    DataManager.debugStorage();
  },
  
  onShow: function() {
    console.log('统计页面显示');
    // 每次显示统计页面时刷新数据
    this.loadStatisticsData();
    
    // 再次调试存储
    DataManager.debugStorage();
  },
  
  loadStatisticsData: function() {
    // 根据当前选择的时间维度加载对应的数据
    switch(this.data.currentPeriod) {
      case '日':
        this.loadDailyData();
        break;
      case '周':
        this.loadWeeklyData();
        break;
      case '月':
        this.loadMonthlyData();
        break;
      case '年':
        this.loadYearlyData();
        break;
    }
  },
  
  loadDailyData: function() {
    // 获取今天的番茄钟记录
    const todayRecords = DataManager.getTodayRecords();
    
    // 生成图表数据
    const chartData = DataManager.generateDailyChartData(todayRecords);
    
    // 生成摘要数据
    const summaryData = DataManager.getStatsByRecords(todayRecords);
    
    // 获取专注记录列表（仅"专注"类型，按时间倒序排列）
    const focusRecords = this.getFocusRecordsForDisplay(todayRecords);
    
    this.setData({
      chartData: chartData,
      summaryData: summaryData,
      focusRecords: focusRecords
    });
  },
  
  loadWeeklyData: function() {
    // 获取本周的番茄钟记录
    const weekRecords = DataManager.getThisWeekRecords();
    
    // 生成图表数据
    const chartData = DataManager.generateWeeklyChartData(weekRecords);
    
    // 生成摘要数据
    const summaryData = DataManager.getStatsByRecords(weekRecords);
    
    // 获取专注记录列表（仅"专注"类型，按时间倒序排列）
    const focusRecords = this.getFocusRecordsForDisplay(weekRecords);
    
    this.setData({
      chartData: chartData,
      summaryData: summaryData,
      focusRecords: focusRecords
    });
  },
  
  loadMonthlyData: function() {
    // 获取本月的番茄钟记录
    const monthRecords = DataManager.getThisMonthRecords();
    
    // 生成图表数据
    const chartData = DataManager.generateMonthlyChartData(monthRecords);
    
    // 生成摘要数据
    const summaryData = DataManager.getStatsByRecords(monthRecords);
    
    // 获取专注记录列表（仅"专注"类型，按时间倒序排列）
    const focusRecords = this.getFocusRecordsForDisplay(monthRecords);
    
    this.setData({
      chartData: chartData,
      summaryData: summaryData,
      focusRecords: focusRecords
    });
  },
  
  loadYearlyData: function() {
    // 获取本年的番茄钟记录
    const yearRecords = DataManager.getThisYearRecords();
    
    // 生成图表数据
    const chartData = DataManager.generateYearlyChartData(yearRecords);
    
    // 生成摘要数据
    const summaryData = DataManager.getStatsByRecords(yearRecords);
    
    // 获取专注记录列表（仅"专注"类型，按时间倒序排列）
    const focusRecords = this.getFocusRecordsForDisplay(yearRecords);
    
    this.setData({
      chartData: chartData,
      summaryData: summaryData,
      focusRecords: focusRecords
    });
  },
  
  // 获取处理后的专注记录列表（用于显示）
  getFocusRecordsForDisplay: function(records) {
    // 仅筛选"专注"类型的记录
    const focusRecords = records.filter(record => record.type === '专注');
    
    // 按开始时间倒序排列（最新的在最前面）
    focusRecords.sort((a, b) => b.startTime - a.startTime);
    
    // 对记录进行格式化，添加显示用的属性
    return focusRecords.map(record => {
      // 计算持续时间（分:秒）
      const minutes = Math.floor(record.duration / 60);
      const seconds = record.duration % 60;
      const durationText = `${minutes}分${seconds > 0 ? seconds + '秒' : ''}`;
      
      // 格式化时间
      const startTime = new Date(record.startTime);
      const timeText = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        ...record,
        durationText: durationText,
        timeText: timeText,
        statusText: record.completed ? '已完成' : '未完成'
      };
    });
  },
  
  // 切换记录列表的显示状态
  toggleRecordsList: function() {
    this.setData({
      showRecordsList: !this.data.showRecordsList
    });
  },
  
  changePeriod: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ currentPeriod: period });
    
    // 切换时间维度后重新加载数据
    this.loadStatisticsData();
  },
  
  // 清空当前时间范围内的专注记录
  clearCurrentRecords: function() {
    const periodText = {
      '日': '今天',
      '周': '本周',
      '月': '本月',
      '年': '今年'
    };
    
    wx.showModal({
      title: '清除记录',
      content: `确定要清除${periodText[this.data.currentPeriod]}的专注记录吗？此操作不可恢复。`,
      confirmColor: '#FF6347',
      success: (res) => {
        if (res.confirm) {
          let startDate, endDate;
          
          // 根据当前时间维度获取日期范围
          switch(this.data.currentPeriod) {
            case '日':
              // 当天
              const today = formatDate(new Date());
              startDate = today;
              endDate = today;
              break;
            case '周':
              // 本周
              const weekRange = getWeekRange(new Date());
              startDate = weekRange.start;
              endDate = weekRange.end;
              break;
            case '月':
              // 本月
              const monthRange = getMonthRange(new Date());
              startDate = monthRange.start;
              endDate = monthRange.end;
              break;
            case '年':
              // 本年
              const yearRange = getYearRange(new Date());
              startDate = yearRange.start;
              endDate = yearRange.end;
              break;
          }
          
          // 调用DataManager的方法清除记录
          const deletedCount = DataManager.clearRecordsByDateRange(startDate, endDate, '专注');
          
          wx.showToast({
            title: `已清除${deletedCount}条记录`,
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadStatisticsData();
        }
      }
    });
  }
});

// 从DataManager.js导入这些方法以供使用
const {
  formatDate,
  getWeekRange,
  getMonthRange,
  getYearRange
} = require('../../utils/dataManager'); 