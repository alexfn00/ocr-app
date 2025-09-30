export default defineAppConfig({
  pages: [
    'pages/query/index',  // tabBar 首页
    'pages/index/index',  // tabBar 退书
    'pages/order/index', // tabBar 订单
    'pages/profile/index',// tabBar 我的
    'pages/login/index',   // 登录页
    'pages/excel/index'    // Excel 相关页面
  ],
  subPackages: [
    {
      root: 'pages/user',
      pages: ['admin/index', 'edit/index'] // 用户管理分包
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    list: [
      {
        pagePath: "pages/query/index",
        text: "首页",
        iconPath: "assets/home.png",
        selectedIconPath: "assets/home-active.png"
      },
      {
        pagePath: "pages/index/index",
        text: "退书",
        iconPath: "assets/return.png",
        selectedIconPath: "assets/return-active.png"
      },
      {
        pagePath: "pages/order/index",
        text: "订单",
        iconPath: "assets/order.png",
        selectedIconPath: "assets/order-active.png"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/profile.png",
        selectedIconPath: "assets/profile-active.png"
      }
    ],
    color: "#999",
    selectedColor: "#07c160",
    backgroundColor: "#ffffff",
    borderStyle: "black",
  }
})
