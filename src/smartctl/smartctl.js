"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.SmartCtl = void 0;
var pcp = require("promisify-child-process");
var SmartCtl = /** @class */ (function () {
    function SmartCtl() {
        this.required_version = {
            maj: 7,
            min: 0
        };
    }
    /**
     * Init checks for the existance of smartctl binary, and that the version is 7.0+ because of the
     * `-j` JSON output option.
     *
     * @returns The instance of this class
     */
    SmartCtl.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var which, output, ver, version, version_parts, version_date, revision, arch, lines, i, element, tlww, parts, parts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, pcp.exec("which smartctl", {
                            timeout: 5000
                        })["catch"](function (err) {
                            throw "Couldn't get version info for smartctl! " + err;
                        })];
                    case 1:
                        which = _a.sent();
                        if (which.stdout != undefined) {
                            output = which.stdout.toString();
                            if ((output) && (output != '')) {
                                this.binary_path = output;
                            }
                            else {
                                throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
                            }
                        }
                        else {
                            throw "smartctl binary not found! Do you have smartmontools version 7+ installed?";
                        }
                        return [4 /*yield*/, pcp.exec(this.binary_path + " -V", {
                                timeout: 5000
                            })];
                    case 2:
                        ver = _a.sent();
                        version = undefined;
                        if (ver.stdout != undefined) {
                            version = ver.stdout.toString();
                        }
                        else {
                            throw "Couldn't get version info for smartctl! Initialize failed!";
                        }
                        version_parts = undefined;
                        version_date = undefined;
                        revision = undefined;
                        arch = undefined;
                        if ((version) && (version != '')) {
                            lines = version.split('\n');
                            for (i = 0; i < lines.length; i++) {
                                element = lines[i];
                                if (element.search("(smartctl) \\d+.\\d+") != -1) {
                                    tlww = element;
                                    parts = tlww.split(' ');
                                    version_parts = parts[1];
                                    version_date = parts[2];
                                    revision = parts[3];
                                    arch = parts[4];
                                    break;
                                }
                            }
                        }
                        else {
                            throw "Couldn't execute smartctl binary with '" + this.binary_path + " -V' Initialize failure!";
                        }
                        if (version_parts) {
                            parts = version_parts.split('.');
                            this.version.maj = Number(parts[0]);
                            this.version.min = Number(parts[1]);
                        }
                        else {
                            throw "Couldn't get version of smartctl! Initialize failure!";
                        }
                        if ((this.version.maj >= this.required_version.maj) && (this.version.min >= this.required_version.min)) {
                            //Yay!
                        }
                        else {
                            throw "smartctl version " + this.version.maj + "." + this.version.min + " is not supported! This library requires smartctl version 7.0 and up! Initialize failure!";
                        }
                        return [2 /*return*/, this];
                }
            });
        });
    };
    return SmartCtl;
}());
exports.SmartCtl = SmartCtl;
