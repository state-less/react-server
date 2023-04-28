"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _MemoryStore = require("./MemoryStore");
var _transport = require("./transport");
describe('transport', function () {
  it('should be able to create a transport', function () {
    var transport = new _transport.Transport();
    expect(transport).toBeDefined();
  });
  it('should be able to create a postgres transport', function () {
    var transport = new _transport.PostgresTransport({
      connectionString: 'postgres://postgres:mysecretpassword@localhost:5433/postgres'
    });
    expect(transport).toBeDefined();
  });
  it('should be able to set a state', /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var transport, store, state;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          transport = new _transport.PostgresTransport({
            connectionString: 'postgres://postgres:mysecretpassword@localhost:5433/postgres'
          });
          store = new _MemoryStore.Store({
            transport: transport
          });
          state = store.createState('hello', {
            scope: 'test',
            key: 'test'
          });
          expect(state.value).toBe('hello');
          _context.next = 6;
          return state.setValue('world');
        case 6:
          expect(state.value).toBe('world');
        case 7:
        case "end":
          return _context.stop();
      }
    }, _callee);
  })));
  it('should be able to get a state', /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var transport, store, state;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          transport = new _transport.PostgresTransport({
            connectionString: 'postgres://postgres:mysecretpassword@localhost:5433/postgres'
          });
          store = new _MemoryStore.Store({
            transport: transport
          });
          state = store.createState('hello', {
            scope: 'test',
            key: 'test'
          });
          expect(state.value).toBe('hello');
          _context2.next = 6;
          return state.getValue(+new Date());
        case 6:
          expect(state.value).toBe('world');
        case 7:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  })));
});