export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/import/index'
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
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "assets/home.png",
        selectedIconPath: "assets/home-active.png"
      },
      {
        pagePath: "pages/import/index",
        text: "导入",
        iconPath: "assets/upload.png",
        selectedIconPath: "assets/upload-active.png"
      }
    ],
    color: "#999",
    selectedColor: "#07c160",
    backgroundColor: "#ffffff",
    borderStyle: "black"
  }
})
