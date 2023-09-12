"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const generators_1 = require("../../../lib/generators");
(0, ava_1.default)("parse calculation list", async (t) => {
    var api = await swagger_parser_1.default.parse("./src/tests/generators/evaluation-calculation/swagger.json");
    const content = await (0, generators_1.generate)(api, "", undefined, true);
    t.snapshot(content);
});
(0, ava_1.default)("Angular parse calculation list", async (t) => {
    var api = await swagger_parser_1.default.parse("./src/tests/generators/evaluation-calculation/swagger.json");
    const content = await (0, generators_1.generate)(api, "", undefined, true, true);
    t.snapshot(content);
});
