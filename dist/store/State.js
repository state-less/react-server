"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.State = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
// | { [key: string]: GenericStateValue };
var State = /*#__PURE__*/function () {
  function State(initialValue, options) {
    (0, _classCallCheck2["default"])(this, State);
    this.id = createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.value = initialValue;
  }
  (0, _createClass2["default"])(State, [{
    key: "setValue",
    value: function () {
      var _setValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(value) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              this.value = value;
              return _context.abrupt("return", this);
            case 2:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function setValue(_x) {
        return _setValue.apply(this, arguments);
      }
      return setValue;
    }()
  }]);
  return State;
}();
exports.State = State;