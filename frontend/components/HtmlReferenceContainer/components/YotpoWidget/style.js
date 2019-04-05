import { css } from 'glamor';
import { themeConfig } from '@shopgate/pwa-common/helpers/config';

const { variables } = themeConfig;

const padding = css({
  padding: `0px ${variables.gap.big}px 0px ${variables.gap.big}px`,
}).toString();

const container = css({
  maxWidth: '100%',
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  '.socialize-wrapper, .yotpo-icon-three-lines, .yotpo-bottomline-empty-state': {
    display: 'none !important',
  },
  ' .yotpo-menu-mobile-collapse': {
    display: 'block !important',
  },
}).toString();

export default {
  container,
  padding,
};
