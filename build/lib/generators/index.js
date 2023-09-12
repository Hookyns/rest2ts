"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const ApiRoutesRender_1 = require("../renderers/ApiRoutesRender");
const ApiDescriptionGenerator_1 = require("./ApiDescriptionGenerator");
const ContractGenerator_1 = require("./ContractGenerator");
const InfrastructureTemplates_1 = require("../renderers/InfrastructureTemplates");
const ServiceGenerator_1 = require("./ServiceGenerator");
const mustache_1 = require("mustache");
const axios_1 = __importDefault(require("axios"));
const AngularServiceGenerator_1 = require("./AngularServiceGenerator");
const generateContent = (schema, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled = false) => {
    const swaggerSchema = schema;
    const routes = (0, ApiRoutesRender_1.renderRoutes)((0, ApiDescriptionGenerator_1.generateRoutes)(swaggerSchema));
    const contracts = (0, ContractGenerator_1.generateContracts)(swaggerSchema, areNullableStringsEnabled);
    const baseApiUrl = generatedCodeBaseUrl
        ? `const API_URL = ${generatedCodeBaseUrl};`
        : `const API_URL = "${baseUrl}";`;
    const view = {
        routes,
        contracts,
        infrastructure: (0, InfrastructureTemplates_1.getInfrastructureTemplate)(),
        services: (0, ServiceGenerator_1.generateServices)(swaggerSchema),
        baseApiUrl,
        // raw: JSON.stringify(api, null, 2),
    };
    const content = (0, mustache_1.render)("{{{ infrastructure }}}\n{{{ routes }}}\n{{{ contracts }}}\n{{{ baseApiUrl }}}\n\n{{{ services }}}\n{{{ raw }}}", view);
    return content;
};
const generateAngularContent = (schema, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled = false) => {
    const swaggerSchema = schema;
    const routes = (0, ApiRoutesRender_1.renderRoutes)((0, ApiDescriptionGenerator_1.generateRoutes)(swaggerSchema));
    const contracts = (0, ContractGenerator_1.generateContracts)(swaggerSchema, areNullableStringsEnabled);
    const view = {
        routes,
        contracts,
        infrastructure: (0, InfrastructureTemplates_1.getAngularInfrastructureTemplate)(),
        services: (0, AngularServiceGenerator_1.generateAngularServices)(swaggerSchema),
    };
    const content = (0, mustache_1.render)("{{{ infrastructure }}}\n{{{ routes }}}\n{{{ contracts }}}\n\n{{{ services }}}\n", view);
    return content;
};
const generate = async (api, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled = false, generateForAngular = false) => {
    if (!!api.swagger && !api.openapi) {
        const response = await axios_1.default.post("https://converter.swagger.io/api/convert", api);
        if (response.status !== 200) {
            console.error(response);
            process.exit(1);
        }
        return generateForAngular
            ? generateAngularContent(response.data, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled)
            : generateContent(response.data, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled);
    }
    return generateForAngular
        ? generateAngularContent(api, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled)
        : generateContent(api, baseUrl, generatedCodeBaseUrl, areNullableStringsEnabled);
};
exports.generate = generate;
