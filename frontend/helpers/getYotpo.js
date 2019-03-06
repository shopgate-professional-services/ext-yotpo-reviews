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

/**
 * Tries to get Yotpo from window Object. If not yet available, tries again.
 * @param {function} resolve Promise.resolve function
 */
function tryYotpo(resolve) {
  if (window.Yotpo) {
    resolve(window.Yotpo);
    return;
  }
  setTimeout(() => {
    tryYotpo(resolve);
  }, 100);
}

/**
 * Injects Yotpo script and returns promise of the Yotpo Object.
 * @returns {Promise<Object>}
 * @param {string} config Yotpo app key.
 */
function yotpoPromise(config) {
  mountScript(config);
  return new Promise((resolve) => {
    tryYotpo(resolve);
  });
}

/**
 * @type {Promise}
 */
let promise;

/**
 * Gets the Yotpo Object
 * @returns {Promise}
 * @param {string} config Yotpo app key.
 */
function getYotpo(config) {
  if (!promise) {
    promise = yotpoPromise(config);
  }
  return promise;
}

export default getYotpo;
