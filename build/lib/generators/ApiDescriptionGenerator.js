"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoutes = exports.getEndpointsDescriptions = exports.formatUrlToCamelCase = void 0;
const trimLast = (s, c) => s[s.length - 1] === c ? s.substring(0, s.length - 1) : s;
const trimStart = (s, c) => s[0] === c ? s.substring(1, s.length) : s;
const snakeToCamel = (str) => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
const getMethodType = (path) => {
    if (path.get) {
        return "GET";
    }
    if (path.post) {
        return "POST";
    }
    if (path.put) {
        return "PUT";
    }
    if (path.delete) {
        return "DELETE";
    }
    if (path.patch) {
        return "PATCH";
    }
    return "";
};
const formatUrlToCamelCase = (str) => trimStart(trimLast(str.replace(/[\W_]+/g, "_"), "_"), "_");
exports.formatUrlToCamelCase = formatUrlToCamelCase;
const getCommonPrefix = (str) => `${(0, exports.formatUrlToCamelCase)(str).split("_")[0]}_`;
const getEndpointsDescriptions = (swagger) => {
    const commonPrefix = Object.keys(swagger.paths).reduce((acc, e) => (getCommonPrefix(e) === acc ? acc : ""), getCommonPrefix(Object.keys(swagger.paths)[0]));
    const endpoints = Object.keys(swagger.paths).map(e => {
        const pathObject = swagger.paths[e];
        const prop = (0, exports.formatUrlToCamelCase)(e).replace(commonPrefix, "");
        const paramIndex = e.indexOf("{");
        const path = paramIndex > 1 ? e.substring(0, paramIndex - 1) : e;
        const methods = [];
        const generate = (methodType, operation) => {
            var _a, _b, _c, _d;
            return {
                name: snakeToCamel(`${methodType.toLowerCase()}_${prop}`),
                url: path,
                pathObject,
                originalPath: e,
                methodType,
                isFileResponse: ((_d = (_c = (_b = (_a = operation.responses) === null || _a === void 0 ? void 0 : _a[200]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c["application/json"]) === null || _d === void 0 ? void 0 : _d.schema.format) === "binary",
            };
        };
        const filterHeaderParameters = (operation) => {
            var _a;
            operation.parameters = ((_a = operation.parameters) !== null && _a !== void 0 ? _a : []).filter(x => x.in !== "header");
        };
        if (pathObject.get) {
            filterHeaderParameters(pathObject.get);
            methods.push(generate("GET", pathObject.get));
        }
        if (pathObject.delete) {
            filterHeaderParameters(pathObject.delete);
            methods.push(generate("DELETE", pathObject.delete));
        }
        if (pathObject.post) {
            filterHeaderParameters(pathObject.post);
            methods.push(generate("POST", pathObject.post));
        }
        if (pathObject.put) {
            filterHeaderParameters(pathObject.put);
            methods.push(generate("PUT", pathObject.put));
        }
        if (pathObject.patch) {
            filterHeaderParameters(pathObject.patch);
            methods.push(generate("PATCH", pathObject.patch));
        }
        return methods;
    });
    return endpoints.flat();
};
exports.getEndpointsDescriptions = getEndpointsDescriptions;
const generateRoutes = (swagger) => {
    const routes = (0, exports.getEndpointsDescriptions)(swagger).reduce((api, e) => {
        api[e.name] = e.url;
        return api;
    }, {});
    return routes;
};
exports.generateRoutes = generateRoutes;
