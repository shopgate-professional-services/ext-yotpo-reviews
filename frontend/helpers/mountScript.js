/**
 * Mounts yotpo js widget script.
 * @param {string} config Yotpo app key.
 */
function mountScript(config) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = `//staticw2.yotpo.com/${config}/widget.js`;
  script.id = 'yotpoWidgetScript';
  const parent = document.getElementsByTagName('head')[0];
  parent.appendChild(script);
}

export default mountScript;
