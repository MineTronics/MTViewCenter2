/**
 * Those tests are not yet runnable in browser, but they show what should be verified.
 */

describe('mt_plug_config', function() {
  it('ensure that changing input value actually changes MT.config', function() {
  	/*
  	 * For some reason, when repeating by (name, value) on a object,
  	 * ```<input ng-model="value.value"/>```
  	 * does not behave as intended. In order to access specific property array
  	 * operator should be used.
  	 * ```<input ng-model="mt.config[name]"/>```
  	 * This test verifies whether this was properly implemented.
  	 */
    browser.get('http://mtvc:9001/');

    var config = element.all(by.repeater('(name,value) in mt.config'));
    config.first().setText('13');
    expect(config.first().getText()).toBe('13');
  });
});
