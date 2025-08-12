export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/import/index',
    'pages/login/index',
    'pages/profile/index',
    'pages/user-admin/index',
    'pages/user-edit/index',
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
    borderStyle: "black"
  }
})
