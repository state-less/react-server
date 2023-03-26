"use strict";

var _MemoryStore = require("./MemoryStore");
describe('MemoryStore', function () {
  var store;
  it('should be able to create a new store', function () {
    store = new _MemoryStore.Store({});
    expect(store).toBeDefined();
  });
  it('should be able to create a new state', function () {
    store.createState(null, {
      key: 'test',
      scope: 'test'
    });
    expect(store.hasState(_MemoryStore.Store.getKey({
      key: 'test',
      scope: 'test'
    }))).toBeTruthy();
  });
  it('should automatically create a new state if it does not exist', function () {
    var state = store.getState('testasd', {});
    expect(state).toBeDefined();
  });
  it('should be able to get the same state if it exists', function () {
    var state = store.getState('testasd', {});
    expect(state).toBeDefined();
  });
  it('should always get the same state', function () {
    var state1 = store.getState('test', {});
    var state2 = store.getState('test', {});
    expect(state1).toBe(state2);
  });
});