/**
 * 番茄钟数据管理工具
 * 负责番茄钟记录的存储、检索和统计
 */

// 获取当前日期的YYYY-MM-DD格式
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当前日期所在周的起始日期
const getWeekRange = (date) => {
  const currentDate = new Date(date);
  const day = currentDate.getDay() || 7; // 如果是周日，getDay()返回0，我们把它当作7
  const diff = currentDate.getDate() - day + 1; // 调整到本周一
  
  const start = new Date(currentDate);
  start.setDate(diff);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // 本周日
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
};

// 获取当前日期所在月的起始日期
const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
};

// 获取当前日期所在年的起始日期
const getYearRange = (date) => {
  const year = date.getFullYear();
  
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
};

// 数据管理类
const DataManager = {
  // 存储键名
  POMODORO_RECORDS_KEY: 'pomodoro_records',
  
  /**
   * 测试函数：检查并打印存储状态
   * 调用此函数可以查看当前存储的所有番茄钟记录
   */
  debugStorage: function() {
    try {
      const records = this.getAllRecords();
      console.log('==== 番茄钟记录调试信息 ====');
      console.log('总记录数:', records.length);
      
      if (records.length > 0) {
        // 打印最近5条记录
        console.log('最近记录:');
        const recentRecords = records.slice(-5);
        recentRecords.forEach((record, index) => {
          console.log(`[${index + 1}] 类型:${record.type}, 时长:${record.duration}秒, 日期:${record.date}, 已完成:${record.completed}`);
        });
        
        // 统计专注记录
        const focusRecords = records.filter(r => r.type === '专注');
        console.log('专注记录总数:', focusRecords.length);
        console.log('专注记录总时长:', this.calculateHours(focusRecords), '小时');
      } else {
        console.log('没有找到任何记录');
      }
      
      console.log('==== 调试信息结束 ====');
      
      return records.length;
    } catch (e) {
      console.error('调试存储时出错:', e);
      return 0;
    }
  },
  
  /**
   * 保存一条番茄钟记录
   * @param {Object} record 记录对象
   * record 格式:
   * {
   *   id: 唯一ID,
   *   type: '专注'|'短休息'|'长休息',
   *   startTime: 开始时间戳,
   *   endTime: 结束时间戳,
   *   duration: 持续时间(秒),
   *   completed: 是否完成,
   *   date: 日期(YYYY-MM-DD)
   * }
   */
  saveRecord: function(record) {
    try {
      // 确保duration单位是秒
      if (typeof record.duration === 'number') {
        // 复制记录对象，避免修改原始对象
        const recordCopy = {...record};
        
        // 如果duration非常大，可能是毫秒，转换为秒
        if (recordCopy.duration > 100000) {
          console.warn('检测到异常大的duration值，可能是毫秒，自动转换为秒:', recordCopy.duration);
          recordCopy.duration = Math.round(recordCopy.duration / 1000);
        }
        
        // 如果duration太小（小于1秒），设置为至少1秒
        if (recordCopy.duration < 1) {
          recordCopy.duration = 1;
        }
        
        // 获取现有记录
        const records = this.getAllRecords();
        
        // 添加新记录
        records.push(recordCopy);
        
        // 保存回本地存储
        wx.setStorageSync(this.POMODORO_RECORDS_KEY, records);
        
        console.log('成功保存番茄钟记录:', recordCopy.type, '持续时间:', recordCopy.duration, '秒');
        
        return true;
      } else {
        console.error('保存番茄钟记录失败: duration不是数字类型', record);
        return false;
      }
    } catch (e) {
      console.error('保存番茄钟记录失败:', e);
      return false;
    }
  },
  
  /**
   * 获取所有番茄钟记录
   * @returns {Array} 所有记录的数组
   */
  getAllRecords: function() {
    try {
      const records = wx.getStorageSync(this.POMODORO_RECORDS_KEY) || [];
      return records;
    } catch (e) {
      console.error('获取番茄钟记录失败:', e);
      return [];
    }
  },
  
  /**
   * 根据日期范围获取记录
   * @param {String} startDate 开始日期(YYYY-MM-DD)
   * @param {String} endDate 结束日期(YYYY-MM-DD)
   * @returns {Array} 符合条件的记录
   */
  getRecordsByDateRange: function(startDate, endDate) {
    const records = this.getAllRecords();
    return records.filter(record => {
      return record.date >= startDate && record.date <= endDate;
    });
  },
  
  /**
   * 获取当天的记录
   * @returns {Array} 当天的记录
   */
  getTodayRecords: function() {
    const today = formatDate(new Date());
    return this.getRecordsByDateRange(today, today);
  },
  
  /**
   * 获取本周的记录
   * @returns {Array} 本周的记录
   */
  getThisWeekRecords: function() {
    const range = getWeekRange(new Date());
    return this.getRecordsByDateRange(range.start, range.end);
  },
  
  /**
   * 获取本月的记录
   * @returns {Array} 本月的记录
   */
  getThisMonthRecords: function() {
    const range = getMonthRange(new Date());
    return this.getRecordsByDateRange(range.start, range.end);
  },
  
  /**
   * 获取本年的记录
   * @returns {Array} 本年的记录
   */
  getThisYearRecords: function() {
    const range = getYearRange(new Date());
    return this.getRecordsByDateRange(range.start, range.end);
  },
  
  /**
   * 按日期分组记录
   * @param {Array} records 记录数组
   * @returns {Object} 按日期分组的记录
   */
  groupRecordsByDate: function(records) {
    const grouped = {};
    
    records.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    
    return grouped;
  },
  
  /**
   * 获取指定时间范围内专注的统计数据
   * @param {Array} records 记录数组
   * @returns {Object} 统计数据
   */
  getStatsByRecords: function(records) {
    // 只统计"专注"类型的记录
    const focusRecords = records.filter(record => record.type === '专注');
    
    // 计算总完成次数
    const completedCount = focusRecords.filter(record => record.completed).length;
    
    // 计算总专注时长(小时)
    const totalSeconds = focusRecords.reduce((total, record) => {
      return total + (record.completed ? record.duration : 0);
    }, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    
    // 计算完成率
    const totalCount = focusRecords.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) + '%' : '0%';
    
    return {
      count: completedCount,
      hours: totalHours,
      rate: completionRate
    };
  },
  
  /**
   * 生成日维度的图表数据
   * @param {Array} records 当天的记录
   * @returns {Array} 图表数据
   */
  generateDailyChartData: function(records) {
    // 按时段分组：上午(5-12)、下午(12-18)、晚上(18-5)
    const morning = records.filter(r => {
      const hour = new Date(r.startTime).getHours();
      return hour >= 5 && hour < 12 && r.type === '专注' && r.completed;
    });
    
    const afternoon = records.filter(r => {
      const hour = new Date(r.startTime).getHours();
      return hour >= 12 && hour < 18 && r.type === '专注' && r.completed;
    });
    
    const evening = records.filter(r => {
      const hour = new Date(r.startTime).getHours();
      return (hour >= 18 || hour < 5) && r.type === '专注' && r.completed;
    });
    
    // 计算每个时段的专注时长(小时)
    const morningHours = this.calculateHours(morning);
    const afternoonHours = this.calculateHours(afternoon);
    const eveningHours = this.calculateHours(evening);
    
    // 计算最大值，以便调整高度百分比
    const maxHours = Math.max(morningHours, afternoonHours, eveningHours, 0.1); // 避免除以0
    
    return [
      { label: '上午', hours: morningHours, height: (morningHours / maxHours) * 80 },
      { label: '下午', hours: afternoonHours, height: (afternoonHours / maxHours) * 80 },
      { label: '晚上', hours: eveningHours, height: (eveningHours / maxHours) * 80 }
    ];
  },
  
  /**
   * 生成周维度的图表数据
   * @param {Array} records 本周的记录
   * @returns {Array} 图表数据
   */
  generateWeeklyChartData: function(records) {
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - (today.getDay() || 7) + 1);
    
    const result = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(mondayDate);
      currentDate.setDate(mondayDate.getDate() + i);
      const dateStr = formatDate(currentDate);
      
      // 获取当天的专注记录
      const dayRecords = records.filter(r => 
        r.date === dateStr && r.type === '专注' && r.completed
      );
      
      const hours = this.calculateHours(dayRecords);
      
      result.push({
        label: weekdays[i],
        date: dateStr,
        hours: hours,
        height: 0 // 先设为0，之后再计算相对高度
      });
    }
    
    // 计算最大值，以便调整高度百分比
    const maxHours = Math.max(...result.map(item => item.hours), 0.1); // 避免除以0
    
    // 设置每个柱子的相对高度
    result.forEach(item => {
      item.height = (item.hours / maxHours) * 80;
    });
    
    return result;
  },
  
  /**
   * 生成月维度的图表数据
   * @param {Array} records 本月的记录
   * @returns {Array} 图表数据
   */
  generateMonthlyChartData: function(records) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 将本月按周分为4周
    const weekRanges = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentYear, currentMonth, 1 + i * 7);
      const weekEnd = new Date(currentYear, currentMonth, 7 + i * 7);
      
      if (weekEnd.getMonth() !== currentMonth) {
        // 如果周结束日期跨月，调整为本月最后一天
        weekEnd.setDate(0);
      }
      
      weekRanges.push({
        start: formatDate(weekStart),
        end: formatDate(weekEnd),
        label: `第${i + 1}周`
      });
    }
    
    const result = [];
    
    for (const week of weekRanges) {
      // 获取每周的专注记录
      const weekRecords = records.filter(r => 
        r.date >= week.start && r.date <= week.end && r.type === '专注' && r.completed
      );
      
      const hours = this.calculateHours(weekRecords);
      
      result.push({
        label: week.label,
        hours: hours,
        height: 0 // 先设为0，之后再计算相对高度
      });
    }
    
    // 计算最大值，以便调整高度百分比
    const maxHours = Math.max(...result.map(item => item.hours), 0.1); // 避免除以0
    
    // 设置每个柱子的相对高度
    result.forEach(item => {
      item.height = (item.hours / maxHours) * 80;
    });
    
    return result;
  },
  
  /**
   * 生成年维度的图表数据
   * @param {Array} records 本年的记录
   * @returns {Array} 图表数据
   */
  generateYearlyChartData: function(records) {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const result = [];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      const startDate = formatDate(monthStart);
      const endDate = formatDate(monthEnd);
      
      // 获取每月的专注记录
      const monthRecords = records.filter(r => 
        r.date >= startDate && r.date <= endDate && r.type === '专注' && r.completed
      );
      
      const hours = this.calculateHours(monthRecords);
      
      result.push({
        label: monthNames[i],
        hours: hours,
        height: 0 // 先设为0，之后再计算相对高度
      });
    }
    
    // 计算最大值，以便调整高度百分比
    const maxHours = Math.max(...result.map(item => item.hours), 0.1); // 避免除以0
    
    // 设置每个柱子的相对高度
    result.forEach(item => {
      item.height = (item.hours / maxHours) * 80;
    });
    
    return result;
  },
  
  /**
   * 计算记录的总小时数
   * @param {Array} records 记录数组
   * @returns {Number} 总小时数
   */
  calculateHours: function(records) {
    const totalSeconds = records.reduce((total, record) => {
      console.log('计算记录:', record.type, '持续时间:', record.duration, '秒');
      return total + record.duration;
    }, 0);
    
    const hours = parseFloat((totalSeconds / 3600).toFixed(1));
    console.log('总时长:', totalSeconds, '秒,', hours, '小时');
    return hours;
  },
  
  /**
   * 清除指定日期范围内特定类型的记录
   * @param {String} startDate 开始日期(YYYY-MM-DD)
   * @param {String} endDate 结束日期(YYYY-MM-DD)
   * @param {String} type 记录类型，可选，不指定则清除所有类型
   * @returns {Number} 被删除的记录数量
   */
  clearRecordsByDateRange: function(startDate, endDate, type) {
    try {
      // 获取所有记录
      const allRecords = this.getAllRecords();
      
      // 找出不在日期范围内或不符合类型的记录（这些将被保留）
      const remainingRecords = allRecords.filter(record => {
        // 如果指定了类型，且记录类型不匹配，则保留
        if (type && record.type !== type) {
          return true;
        }
        
        // 如果记录日期不在范围内，则保留
        return record.date < startDate || record.date > endDate;
      });
      
      // 计算删除的记录数
      const deletedCount = allRecords.length - remainingRecords.length;
      
      // 保存剩余记录
      wx.setStorageSync(this.POMODORO_RECORDS_KEY, remainingRecords);
      
      console.log(`已删除${deletedCount}条记录，日期范围：${startDate}至${endDate}，类型：${type || '所有'}`);
      
      return deletedCount;
    } catch (e) {
      console.error('清除番茄钟记录失败:', e);
      return 0;
    }
  }
};

// 导出数据管理类和工具函数
module.exports = {
  ...DataManager,
  formatDate,
  getWeekRange,
  getMonthRange,
  getYearRange
}; 