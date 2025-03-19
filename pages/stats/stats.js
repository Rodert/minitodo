Page({
  data: {
    currentPeriod: '周',
    chartData: [],
    summaryData: {
      count: 24,
      hours: 12.5,
      rate: '85%'
    }
  },

  onLoad: function() {
    this.generateChartData();
  },
  
  changePeriod: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ currentPeriod: period });
    this.generateChartData();
    
    // 更新总结数据
    let summaryData = {};
    switch(period) {
      case '日':
        summaryData = { count: 5, hours: 2.5, rate: '90%' };
        break;
      case '周':
        summaryData = { count: 24, hours: 12.5, rate: '85%' };
        break;
      case '月':
        summaryData = { count: 95, hours: 47.5, rate: '80%' };
        break;
      case '年':
        summaryData = { count: 1250, hours: 625, rate: '75%' };
        break;
    }
    
    this.setData({ summaryData });
  },
  
  generateChartData: function() {
    let data = [];
    let labels = [];
    
    switch(this.data.currentPeriod) {
      case '日':
        labels = ['上午', '下午', '晚上'];
        break;
      case '周':
        labels = ['一', '二', '三', '四', '五', '六', '日'];
        break;
      case '月':
        labels = Array.from({length: 4}, (_, i) => `第${i+1}周`);
        break;
      case '年':
        labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        break;
    }
    
    data = labels.map(label => {
      return {
        label: label,
        height: Math.floor(Math.random() * 80) + 10 // 随机高度10-90%
      };
    });
    
    this.setData({ chartData: data });
  }
}) 