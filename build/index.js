#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const opt = __importStar(require("optimist"));
// import https from "https";
// const rootCas = require("ssl-root-cas/latest").create();
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const generators_1 = require("./lib/generators");
const optimist = opt
    .usage("Usage: rest2ts -s path/to/swagger.json")
    .alias("h", "help")
    .alias("s", "source")
    .alias("t", "target")
    .alias("v", "urlValue")
    .alias("f", "fileName")
    .alias("nullstr", "areNullableStringsEnabled")
    .alias("ng", "generateForAngular")
    .describe("t", "If set, jwt token will be set to local storage with key as value of this param")
    .describe("s", "Path to the swagger file")
    .describe("t", "Target path")
    .describe("b", "Base url value used in generated code, can be string, or node global value")
    .describe("nullstr", "Are nullable strings enabled. Values 0/1")
    .describe("ng", "Generates output for angular with HttpClient and Rxjs. Values 0/1")
    .describe("f", "Output file name. Default file name is Api.ts");
const { help, source, target, urlValue, areNullableStringsEnabled, generateForAngular, fileName, } = optimist.argv;
if (help) {
    optimist.showHelp();
    process.exit(0);
}
if (source === undefined) {
    console.error("Source -s not set");
    process.exit(1);
}
if (target === undefined) {
    console.error("Target -t not set");
    process.exit(1);
}
console.log(`Getting openAPI from ${source}`);
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const baseUrl = source.substring(0, source.indexOf("/swagger/"));
swagger_parser_1.default.parse(source, async (err, api) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else if (api) {
        const content = await (0, generators_1.generate)(api, baseUrl, urlValue, areNullableStringsEnabled == true, generateForAngular == true);
        fs_extra_1.default.outputFile(`${target}/${fileName !== null && fileName !== void 0 ? fileName : "Api.ts"}`, content).catch(err => {
            console.error(err);
            process.exit(1);
        });
    }
    else {
        console.error(`Something went wrong`);
        process.exit(1);
    }
});
