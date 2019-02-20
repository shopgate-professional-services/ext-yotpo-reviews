import mountScript from './mountScript';

describe('mountScript', () => {
  it('should run mountScript', () => {
    document.head.innerHTML =
    '<head>' +
    '</head>';
    mountScript('mock');
    expect(document.head.getElementsByTagName('script')).toBeTruthy();
  });
});
