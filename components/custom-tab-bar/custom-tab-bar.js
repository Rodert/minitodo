Component({
  properties: {
    active: {
      type: Number,
      value: 0
    },
    theme: {
      type: String,
      value: 'work'
    }
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      
      // 如果点击的是当前页面，不做任何操作
      if (index === this.properties.active) {
        return;
      }
      
      const pages = ['index', 'stats', 'settings'];
      const url = `/pages/${pages[index]}/${pages[index]}`;
      
      // 使用redirectTo而不是navigateTo，避免页面堆栈过多
      wx.redirectTo({
        url: url
      });
    }
  }
}); 