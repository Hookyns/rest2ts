"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateServices = exports.parametrizeUrl = exports.getRequestContractType = void 0;
const ApiDescriptionGenerator_1 = require("./ApiDescriptionGenerator");
const mustache_1 = require("mustache");
const purify_ts_1 = require("purify-ts");
const Common_1 = require("./Common");
const getRequestContractType = (endpointDescription) => {
    var _a, _b, _c;
    const getContractType = (op) => {
        const schema = op.requestBody.content["application/json"].schema;
        const isRequestParamArray = schema.type === "array" && !!schema.items;
        const refName = isRequestParamArray
            ? schema.items.$ref
            : schema.$ref;
        return purify_ts_1.Maybe.fromNullable(refName)
            .chain(e => (0, purify_ts_1.Just)((0, Common_1.getTypeNameFromRef)(e)))
            .chain(v => (0, purify_ts_1.Just)({
            contractParameterName: "requestContract",
            formattedParam: `requestContract: ${v}${isRequestParamArray ? "[]" : ""}`,
        }));
    };
    const post = endpointDescription.pathObject.post;
    if (post && ((_a = post.requestBody) === null || _a === void 0 ? void 0 : _a.content["application/json"])) {
        return getContractType(post);
    }
    const put = endpointDescription.pathObject.put;
    if (put && ((_b = put.requestBody) === null || _b === void 0 ? void 0 : _b.content["application/json"])) {
        return getContractType(put);
    }
    const patch = endpointDescription.pathObject.patch;
    if (patch && ((_c = patch.requestBody) === null || _c === void 0 ? void 0 : _c.content["application/json"])) {
        return getContractType(patch);
    }
    return purify_ts_1.Nothing;
};
exports.getRequestContractType = getRequestContractType;
const getContractResult = (endpointDescription) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const getTypeFromOperation = (operation) => {
        var _a;
        const schema = operation.responses["200"].content["application/json"].schema;
        if (schema.type === "array") {
            const typeName = purify_ts_1.Maybe.fromNullable(schema.items)
                .chain(e => (e instanceof Array ? (0, purify_ts_1.Just)(e[0]) : (0, purify_ts_1.Just)(e)))
                .chain(e => (e.$ref ? (0, purify_ts_1.Just)(e.$ref) : purify_ts_1.Nothing))
                .chain(e => (0, purify_ts_1.Just)((0, Common_1.getTypeNameFromRef)(e)))
                .orDefault("");
            return (0, purify_ts_1.Just)(`${typeName}[]`);
        }
        return purify_ts_1.Maybe.fromNullable((_a = schema.$ref) !== null && _a !== void 0 ? _a : schema.type).chain(e => (0, purify_ts_1.Just)((0, Common_1.getTypeNameFromRef)(e)));
    };
    const post = endpointDescription.pathObject.post;
    if (endpointDescription.methodType === "POST" &&
        post &&
        ((_b = (_a = post.responses["200"]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b["application/json"])) {
        return getTypeFromOperation(post);
    }
    const get = endpointDescription.pathObject.get;
    if (endpointDescription.methodType === "GET" &&
        get &&
        ((_d = (_c = get.responses["200"]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d["application/json"])) {
        return getTypeFromOperation(get);
    }
    const put = endpointDescription.pathObject.put;
    if (endpointDescription.methodType === "PUT" &&
        put &&
        ((_f = (_e = put.responses["200"]) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f["application/json"])) {
        return getTypeFromOperation(put);
    }
    const deleteOp = endpointDescription.pathObject.delete;
    if (endpointDescription.methodType === "DELETE" &&
        deleteOp &&
        ((_h = (_g = deleteOp.responses["200"]) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h["application/json"])) {
        return getTypeFromOperation(deleteOp);
    }
    const patch = endpointDescription.pathObject.patch;
    if (endpointDescription.methodType === "PATCH" &&
        patch &&
        ((_k = (_j = patch.responses["200"]) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k["application/json"])) {
        return getTypeFromOperation(patch);
    }
    return purify_ts_1.Nothing;
};
const parametrizeUrl = (endpointDescription) => {
    var _a;
    const getType = (parameter, schema) => {
        const nullability = !parameter.required && schema.nullable
            ? " | undefined | null"
            : "";
        switch (schema.type) {
            case "integer":
                return `number${nullability}`;
            case "object":
                return `{}${nullability}`;
            case "array":
                const arrayTypeSchema = purify_ts_1.Maybe.fromNullable(schema.items)
                    .chain(e => (e instanceof Array ? (0, purify_ts_1.Just)(e[0]) : (0, purify_ts_1.Just)(e)))
                    .chain(e => (0, purify_ts_1.Just)(e.$ref ? (0, Common_1.getTypeNameFromRef)(e.$ref) : getType(parameter, e)))
                    .orDefault("");
                return `${arrayTypeSchema}[]${nullability}`;
            default:
                return `${schema.type ||
                    schema.allOf ||
                    (schema.$ref && (0, Common_1.getTypeNameFromRef)(schema.$ref))}${nullability}`;
        }
    };
    const getParameters = () => {
        var _a, _b, _c, _d, _e;
        switch (endpointDescription.methodType) {
            case "DELETE":
                return (_a = endpointDescription.pathObject.delete) === null || _a === void 0 ? void 0 : _a.parameters;
            case "GET":
                return (_b = endpointDescription.pathObject.get) === null || _b === void 0 ? void 0 : _b.parameters;
            case "PATCH":
                return (_c = endpointDescription.pathObject.patch) === null || _c === void 0 ? void 0 : _c.parameters;
            case "POST":
                return (_d = endpointDescription.pathObject.post) === null || _d === void 0 ? void 0 : _d.parameters;
            case "PUT":
                return (_e = endpointDescription.pathObject.put) === null || _e === void 0 ? void 0 : _e.parameters;
            default:
                return [];
        }
    };
    const parameters = ((_a = getParameters()) !== null && _a !== void 0 ? _a : []).map(e => {
        const param = {
            name: e.name,
            type: getType(e, e.schema),
            required: !!e.required,
        };
        return param;
    });
    const formattedFunctionParameters = parameters
        .map(e => `${e.name.split(".").join("")}${e.required ? "" : "?"}: ${e.type}`)
        .join(", ");
    const parametrizedUrl = parameters.reduce(({ url, usedParameters }, e) => {
        const match = `\{${e.name}\}`;
        var index = url.indexOf(match);
        return index > -1
            ? {
                url: url.replace(match, `\$${match}`),
                usedParameters: [...usedParameters, ...[e.name]],
            }
            : { url, usedParameters };
    }, {
        url: endpointDescription.originalPath,
        usedParameters: new Array(),
    });
    const unusedParameters = parameters
        .filter(e => !parametrizedUrl.usedParameters.some(x => x === e.name))
        .map(e => `"${e.name}": ${e.name.split(".").join("")}`);
    return { parametrizedUrl, formattedFunctionParameters, unusedParameters };
};
exports.parametrizeUrl = parametrizeUrl;
const parametrizedMethod = (endpointDescription, contractParameterName, contractResult) => {
    const { unusedParameters, parametrizedUrl, formattedFunctionParameters } = (0, exports.parametrizeUrl)(endpointDescription);
    const method = endpointDescription.methodType.charAt(0) +
        endpointDescription.methodType.substring(1).toLowerCase();
    const queryParams = unusedParameters.length > 0
        ? (0, mustache_1.render)("const queryParams = {\n\t\t{{{rows}}}\n\t}\n\t", {
            rows: unusedParameters.join("\t\t,\n"),
        })
        : "";
    const parameters = [
        `\`\$\{API_URL\}${parametrizedUrl.url}\``,
        "headers",
        ...[unusedParameters.length > 0 ? "queryParams" : "{}"],
    ].join(", ");
    const paramSeparator = formattedFunctionParameters.length > 0 ? ", " : "";
    const view = {
        name: endpointDescription.name,
        contractParameterName,
        contractResult,
        parameters,
        queryParams,
        formattedParam: `${formattedFunctionParameters}${paramSeparator}headers = new Headers()`,
        method,
    };
    return (0, mustache_1.render)("export const {{name}} = ({{{formattedParam}}}): \n\tPromise<FetchResponse<{{contractResult}}>> => {\n\t{{{queryParams}}}return api{{method}}({{{parameters}}});\n}\n", view);
};
const bodyBasedMethod = (endpointDescription, formattedRequestContractType, contractParameterName, contractResult, methodType) => {
    const getMethodType = () => {
        switch (methodType) {
            case "PUT":
                return "Put";
            case "PATCH":
                return "Patch";
            default:
                return "Post";
        }
    };
    const { parametrizedUrl, formattedFunctionParameters } = (0, exports.parametrizeUrl)(endpointDescription);
    const paramSeparator = formattedFunctionParameters.length > 0 ? ", " : "";
    const comma = formattedRequestContractType.length > 0 ? ", " : "";
    const method = getMethodType();
    const view = {
        name: endpointDescription.name,
        contractParameterName,
        contractResult,
        url: `\`\$\{API_URL\}${parametrizedUrl.url}\``,
        formattedParam: `${formattedRequestContractType}${comma}${formattedFunctionParameters}${paramSeparator}headers = new Headers()`,
        method,
    };
    return (0, mustache_1.render)("export const {{name}} = ({{{formattedParam}}}): \n\tPromise<FetchResponse<{{contractResult}}>> => \n\tapi{{method}}({{{url}}}, {{contractParameterName}}, headers);\n", view);
};
const generateServices = (swagger) => {
    const endpoints = (0, ApiDescriptionGenerator_1.getEndpointsDescriptions)(swagger);
    const view = endpoints
        .map(endpointDescription => {
        const { formattedParam: formattedRequestContractType, contractParameterName, } = (0, exports.getRequestContractType)(endpointDescription).orDefault({
            formattedParam: "",
            contractParameterName: "{}",
        });
        const contractResult = getContractResult(endpointDescription).orDefault("any");
        if (endpointDescription.methodType === "POST" ||
            endpointDescription.methodType === "PUT" ||
            endpointDescription.methodType === "PATCH") {
            return bodyBasedMethod(endpointDescription, formattedRequestContractType, contractParameterName, contractResult, endpointDescription.methodType);
        }
        if (endpointDescription.methodType === "GET" ||
            endpointDescription.methodType === "DELETE") {
            return parametrizedMethod(endpointDescription, contractParameterName, contractResult);
        }
        return `// ${endpointDescription.name}\n`;
    })
        .join("\n");
    const API = (0, mustache_1.render)(`export const API = { \n\t{{{ rows }}}\n}\n`, {
        rows: endpoints.map(e => e.name).join(",\n\t"),
    });
    return `${view}\n${API}`;
};
exports.generateServices = generateServices;
