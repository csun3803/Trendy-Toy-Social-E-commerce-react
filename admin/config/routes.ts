/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    //用户相关路由，控制登录页面
    path: '/user',
    layout: false,    // 关键：禁用默认布局
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  // {
  //   path: '/welcome',
  //   name: 'welcome',
  //   icon: 'smile',
  //   component: './Welcome',
  // },
  // {
  //   path: '/admin',
  //   name: 'admin',
  //   icon: 'crown',
  //   access: 'canAdmin',
  //   routes: [
  //     {
  //       path: '/admin',
  //       redirect: '/admin/sub-page',
  //     },
  //     {
  //       path: '/admin/sub-page',
  //       name: 'sub-page',
  //       component: './Admin',
  //     },
  //   ],
  // },
  {
    path: '/admin-dashboard',
    name: '平台仪表盘',
    locale: false,
    icon: 'dashboard',
    access: 'canAdmin',
    component: './AdminDashboard',
  },
  {
    path: '/user-manage',
    name: '用户管理',
    locale: false,
    icon: 'user',
    access: 'canAdmin',
    routes: [
      {
        path: '/user-manage',
        redirect: '/user-manage/list',
      },
      {
        path: '/user-manage/list',
        name: '用户列表',
        locale: false,
        component: './UserManage/UserList',
      },
    ],
  },
  {
    path: '/album',
    name: '图鉴管理',
    locale: false,
    icon: 'book',
    access: 'canAdmin',
    routes: [
      {
        path: '/album',
        redirect: '/album/list',
      },
      {
        path: '/album/list',
        name: '图鉴列表',
        locale: false,
        component: './Album/AlbumList',
      },
    ],
  },
  {
    path: '/blind-box-supervision',
    name: '抽盒机监管',
    locale: false,
    icon: 'gift',
    access: 'canAdmin',
    routes: [
      {
        path: '/blind-box-supervision',
        redirect: '/blind-box-supervision/list',
      },
      {
        path: '/blind-box-supervision/list',
        name: '全平台抽盒机',
        locale: false,
        component: './AdminManage/BlindBoxMachineSupervision',
      },
      {
        path: '/blind-box-supervision/audit',
        name: '抽盒机审核',
        locale: false,
        component: './AdminManage/BlindBoxMachineAudit',
      },
    ],
  },
  {
    path: '/merchant-manage',
    name: '商家管理',
    locale: false,
    icon: 'shop',
    access: 'canAdmin',
    routes: [
      {
        path: '/merchant-manage',
        redirect: '/merchant-manage/list',
      },
      {
        path: '/merchant-manage/list',
        name: '商家列表',
        locale: false,
        component: './AdminManage/MerchantList',
      },
      {
        path: '/merchant-manage/merchant-admin',
        name: '商家管理员',
        locale: false,
        component: './AdminManage/MerchantAdmin',
      },
    ],
  },
  {
    path: '/order-management',
    name: '订单管理',
    locale: false,
    icon: 'shopping',
    access: 'canAdmin',
    routes: [
      {
        path: '/order-management',
        redirect: '/order-management/orders',
      },
      {
        path: '/order-management/orders',
        name: '订单列表',
        locale: false,
        component: './OrderManagement/OrderList',
      },
      {
        path: '/order-management/after-sales',
        name: '售后管理',
        locale: false,
        component: './OrderManagement/AfterSaleList',
      },
    ],
  },
  {
    path: '/coupon',
    name: '优惠券管理',
    locale: false,
    icon: 'gift',
    access: 'canAdmin',
    routes: [
      {
        path: '/coupon',
        redirect: '/coupon/template',
      },
      {
        path: '/coupon/template',
        name: '模板列表',
        locale: false,
        component: './Coupon/TemplateList',
      },
      {
        path: '/coupon/issue-manage',
        name: '发券管理',
        locale: false,
        component: './Coupon/UserCouponList',
      },
    ],
  },
  {
    path: '/community',
    name: '社区管理',
    locale: false,
    icon: 'fileText',
    access: 'canAdmin',
    routes: [
      {
        path: '/community',
        redirect: '/community/list',
      },
      {
        path: '/community/list',
        name: '社区内容列表',
        locale: false,
        component: './Activity/ActivityList',
      },
      {
        path: '/community/banner',
        name: '轮播图管理',
        locale: false,
        component: './Banner/BannerList',
      },
      {
        path: '/community/detail/:activityId',
        component: './Activity/ActivityDetail',
      },
    ],
  },
  {
    path: '/customer-service',
    name: '客服管理',
    locale: false,
    icon: 'customerService',
    access: 'canAdmin',
    routes: [
      {
        path: '/customer-service',
        redirect: '/customer-service/sessions',
      },
      {
        path: '/customer-service/sessions',
        name: '对话列表',
        locale: false,
        component: './CustomerService/SessionList',
      },
      {
        path: '/customer-service/chat/:sessionId',
        component: './CustomerService/ChatDetail',
      },
    ],
  },
  {
    path: '/system-settings',
    name: '系统设置',
    locale: false,
    icon: 'setting',
    access: 'canAdmin',
    routes: [
      {
        path: '/system-settings',
        redirect: '/system-settings/platform-admin',
      },
      {
        path: '/system-settings/platform-admin',
        name: '平台管理员',
        locale: false,
        component: './AdminManage/PlatformAdmin',
      },
      {
        path: '/system-settings/audit-log',
        name: '审计日志',
        locale: false,
        component: './AuditLog/AuditLogList',
      },
    ],
  },
  {
    path: '/merchant',
    name: '商家入驻',
    locale: false,
    icon: 'shop',
    access: 'canMerchantPending',
    routes: [
      {
        path: '/merchant',
        redirect: '/merchant/apply',
      },
      {
        path: '/merchant/apply',
        name: '入驻申请',
        locale: false,
        component: './Merchant/ApplyForm',
      },
      {
        path: '/merchant/audit-pending',
        name: '审核状态',
        locale: false,
        component: './Merchant/AuditPending',
      },
    ],
  },
  {
    path: '/merchant-center',
    name: '商家中心',
    locale: false,
    icon: 'shop',
    access: 'canMerchantApproved',
    routes: [
      {
        path: '/merchant-center',
        redirect: '/merchant-center/dashboard',
      },
      {
        path: '/merchant-center/dashboard',
        name: '店铺数据',
        locale: false,
        component: './Merchant/MerchantDashboard',
      },
      {
        path: '/merchant-center/shop-info',
        name: '店铺信息',
        locale: false,
        component: './Merchant/ShopDashboard',
      },
    ],
  },
  {
    path: '/merchant/products',
    name: '商品管理',
    locale: false,
    icon: 'product',
    access: 'canMerchantApproved',
    routes: [
      {
        path: '/merchant/products',
        redirect: '/merchant/products/list',
      },
      {
        path: '/merchant/products/list',
        name: '销售系列列表',
        locale: false,
        component: './Merchant/SaleSeries',
      },
      {
        path: '/merchant/products/variants/:saleSeriesId',
        component: './Merchant/SaleVariants',
        // 不显示在菜单中
      },
    ],
  },
  {
    path: '/merchant-center/blind-box',
    name: '抽盒机管理',
    locale: false,
    icon: 'gift',
    access: 'canMerchantApproved',
    routes: [
      {
        path: '/merchant-center/blind-box',
        redirect: '/merchant-center/blind-box/list',
      },
      {
        path: '/merchant-center/blind-box/list',
        name: '抽盒机列表',
        locale: false,
        component: './Merchant/BlindBox/BlindBoxMachineList',
      },
      {
        path: '/merchant-center/blind-box/edit/:machineId',
        component: './Merchant/BlindBox/BlindBoxMachineEdit',
        // 不显示在菜单中
      },
      {
        path: '/merchant-center/blind-box/data/:machineId',
        component: './Merchant/BlindBox/BlindBoxMachineData',
        // 不显示在菜单中
      },
    ],
  },
  {
    path: '/merchant/orders',
    name: '订单管理',
    locale: false,
    icon: 'shopping',
    access: 'canMerchantApproved',
    routes: [
      {
        path: '/merchant/orders',
        redirect: '/merchant/orders/list',
      },
      {
        path: '/merchant/orders/list',
        name: '正常订单',
        locale: false,
        component: './Merchant/Orders',
      },
      {
        path: '/merchant/orders/after-sale',
        name: '退款/售后',
        locale: false,
        component: './Merchant/AfterSaleOrders',
      },
    ],
  },
  // {
  //   name: 'list.table-list',
  //   icon: 'table',
  //   path: '/list',
  //   component: './table-list',
  // },
  {
    path: '/',
    component: './HomeRedirect',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
