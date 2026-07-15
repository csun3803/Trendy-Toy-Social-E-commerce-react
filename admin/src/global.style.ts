import { createStyles } from 'antd-style';

const useStyles = createStyles(() => {
  return {
    colorWeak: {
      filter: 'invert(80%)',
    },
    'ant-layout': {
      height: '100%',
    },
    'ant-pro-sider.ant-layout-sider.ant-pro-sider-fixed': {
      left: 'unset',
    },
    canvas: {
      display: 'block',
    },
    body: {
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    'ul,ol': {
      listStyle: 'none',
    },
    '.ant-pro-layout-content': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    },
    '.ant-pro-page-container-children-content': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      paddingRight: '34px',
    },
    '.ant-table-wrapper': {
      '.ant-table': {
        width: '100%',
      },
      '.ant-table-thead > tr > th': {
        padding: '12px 16px',
      },
      '.ant-table-tbody > tr > td': {
        padding: '12px 16px',
      },
    },
    '.ant-card-body': {
      '.ant-table-wrapper': {
        padding: '0 4px',
      },
    },
    '@media(max-width: 768px)': {
      'ant-table': {
        width: '100%',
        overflowX: 'auto',
        '&-thead > tr,    &-tbody > tr': {
          '> th,      > td': {
            whiteSpace: 'pre',
            '> span': {
              display: 'block',
            },
          },
        },
      },
    },
  };
});

export default useStyles;
