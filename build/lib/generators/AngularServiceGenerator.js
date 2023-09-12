"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAngularServices = void 0;
const mustache_1 = require("mustache");
const purify_ts_1 = require("purify-ts");
const ApiDescriptionGenerator_1 = require("./ApiDescriptionGenerator");
const Common_1 = require("./Common");
const ServiceGenerator_1 = require("./ServiceGenerator");
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
    const { parametrizedUrl, formattedFunctionParameters } = (0, ServiceGenerator_1.parametrizeUrl)(endpointDescription);
    const comma = formattedRequestContractType.length > 0 ? ", " : "";
    const method = getMethodType();
    const view = {
        name: endpointDescription.name,
        contractParameterName,
        contractResult,
        url: `\`\$\{this.baseUrl\}${parametrizedUrl.url}\``,
        formattedParam: `${formattedRequestContractType}${formattedFunctionParameters ? comma : ""}${formattedFunctionParameters}`,
        method,
    };
    return (0, mustache_1.render)(`
    {{name}}({{{formattedParam}}}): Observable<{{{contractResult}}}> { 
      return api{{method}}<{{{contractResult}}}>(this.httpClient, {{{url}}}, {{contractParameterName}});
    }
  `, view);
};
const parametrizedMethod = (endpointDescription, contractResult) => {
    const { unusedParameters, parametrizedUrl, formattedFunctionParameters } = (0, ServiceGenerator_1.parametrizeUrl)(endpointDescription);
    const method = `${endpointDescription.methodType.charAt(0)}${endpointDescription.methodType.substring(1).toLowerCase()}${endpointDescription.isFileResponse ? "File" : ""}`;
    const queryParams = unusedParameters.length > 0
        ? (0, mustache_1.render)("const queryParams = {\n\t\t{{{rows}}}\n\t}\n\t", {
            rows: unusedParameters.join("\t\t,\n"),
        })
        : "";
    const parameters = [
        `\`\$\{this.baseUrl\}${parametrizedUrl.url}\``,
        ...[unusedParameters.length > 0 ? "queryParams" : ""],
    ]
        .filter(x => !!x)
        .join(", ");
    const view = {
        name: endpointDescription.name,
        contractResult,
        parameters,
        queryParams,
        formattedParam: `${formattedFunctionParameters}`,
        method: method,
    };
    return (0, mustache_1.render)(`
    {{name}}({{{formattedParam}}}): Observable<{{{contractResult}}}> {
      {{{queryParams}}}
      return api{{method}}<{{{contractResult}}}>(this.httpClient, {{{parameters}}});
    }
    `, view);
};
const getContractResult = (endpointDescription) => {
    const getSchemas = (operation) => Object.entries(operation.responses).map(e => {
        var _a, _b, _c, _d;
        return ({
            status: e[0],
            schema: (_d = (_c = (_b = (_a = e[1]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b["application/json"]) === null || _c === void 0 ? void 0 : _c.schema) !== null && _d !== void 0 ? _d : null,
        });
    });
    const getTypeName = (schema, isArray) => {
        var _a, _b;
        if (schema.oneOf) {
            const typeNames = schema.oneOf
                .map(s => { var _a, _b; return (0, Common_1.getTypeNameFromRef)((_b = (_a = s.$ref) !== null && _a !== void 0 ? _a : s.type) !== null && _b !== void 0 ? _b : "") || "any"; })
                .join(" | ");
            return isArray ? `(${typeNames})[]` : typeNames;
        }
        const typeName = (0, Common_1.getTypeNameFromRef)((_b = (_a = schema.$ref) !== null && _a !== void 0 ? _a : schema.type) !== null && _b !== void 0 ? _b : "") || "any";
        return isArray ? `${typeName}[]` : typeName;
    };
    const getTypeFromOperation = (schemas) => {
        const type = schemas
            .map(({ schema, status }) => {
            if (!schema) {
                return `ResponseResult<void, ${status}>`;
            }
            const isFileSchema = schema.format === "binary";
            if (schema.type === "array") {
                const typeName = purify_ts_1.Maybe.fromNullable(schema.items)
                    .chain(e => (e instanceof Array ? (0, purify_ts_1.Just)(e[0]) : (0, purify_ts_1.Just)(e)))
                    .chain(e => (0, purify_ts_1.Just)(isFileSchema ? "FileResponse" : getTypeName(e, true)))
                    .orDefault("");
                return `ResponseResult<${typeName}, ${status}>`;
            }
            return `ResponseResult<${isFileSchema ? "FileResponse" : getTypeName(schema, false)}, ${status}>`;
        })
            .join(" | ");
        return (0, purify_ts_1.Just)(type);
    };
    const post = endpointDescription.pathObject.post;
    if (endpointDescription.methodType === "POST" && post) {
        return getTypeFromOperation(getSchemas(post));
    }
    const get = endpointDescription.pathObject.get;
    if (endpointDescription.methodType === "GET" && get) {
        return getTypeFromOperation(getSchemas(get));
    }
    const put = endpointDescription.pathObject.put;
    if (endpointDescription.methodType === "PUT" && put) {
        return getTypeFromOperation(getSchemas(put));
    }
    const deleteOp = endpointDescription.pathObject.delete;
    if (endpointDescription.methodType === "DELETE" && deleteOp) {
        return getTypeFromOperation(getSchemas(deleteOp));
    }
    const patch = endpointDescription.pathObject.patch;
    if (endpointDescription.methodType === "PATCH" && patch) {
        return getTypeFromOperation(getSchemas(patch));
    }
    return purify_ts_1.Nothing;
};
const generateAngularServices = (swagger) => {
    const endpoints = (0, ApiDescriptionGenerator_1.getEndpointsDescriptions)(swagger).map(endpointDescription => {
        const { formattedParam: formattedRequestContractType, contractParameterName, } = (0, ServiceGenerator_1.getRequestContractType)(endpointDescription).orDefault({
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
            return parametrizedMethod(endpointDescription, contractResult);
        }
        return `// ${endpointDescription.name}\n`;
    });
    const view = (0, mustache_1.render)(`
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable()
export class ApiService {
  private httpClient: HttpClient;
  private baseUrl: string;

  constructor(
    @Inject(HttpClient) httpClient: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
      this.httpClient = httpClient;
      this.baseUrl = baseUrl ?? "";
  }

  \n\t{{{ rows }}}\n\n
}
  
  `, {
        rows: endpoints.join("\n"),
    });
    return `${view}\n`;
};
exports.generateAngularServices = generateAngularServices;
