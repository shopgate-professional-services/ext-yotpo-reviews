import getYotpo from './getYotpo';

describe('mountScript', () => {
  it('should inject yotpo script', () => {
    document.head.innerHTML =
    '<head>' +
    '</head>';
    getYotpo('mock');
    expect(document.head.getElementsByTagName('script')).toBeTruthy();
  });
});
