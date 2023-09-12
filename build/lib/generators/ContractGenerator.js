"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContracts = void 0;
const mustache_1 = require("mustache");
const Common_1 = require("./Common");
const purify_ts_1 = require("purify-ts");
const addSchemaAllOf = (allOf, swagger, areNullableStringsEnabled) => {
    if (!(allOf === null || allOf === void 0 ? void 0 : allOf.length)) {
        return "";
    }
    const properties = allOf
        .filter(x => !!x.$ref)
        .map(({ $ref }) => {
        const typeName = (0, Common_1.getTypeNameFromRef)($ref);
        const t = swagger.components.schemas[typeName];
        return renderProperties(swagger, areNullableStringsEnabled)(t);
    })
        .join("\n\t");
    return `\n\t${properties}`;
};
const renderProperties = (swagger, areNullableStringsEnabled) => (schema) => {
    var _a, _b, _c, _d;
    if (schema.type === "object" &&
        !!Object.keys((_a = schema === null || schema === void 0 ? void 0 : schema.properties) !== null && _a !== void 0 ? _a : {}).length) {
        const properties = Object.keys((_b = schema.properties) !== null && _b !== void 0 ? _b : {})
            .map(op => {
            const childProp = schema.properties[op];
            const type = renderProperties(swagger, areNullableStringsEnabled)(childProp);
            const isNullable = childProp.nullable &&
                //TODO rest of condition will be remove, when areNullableStringsEnabled will be deprecated
                (type !== "string" ||
                    (type === "string" && areNullableStringsEnabled));
            const view = {
                name: isNullable ? `${op}?` : op,
                type: isNullable ? `${type} | null` : type,
            };
            return (0, mustache_1.render)("{{ name }}: {{ type }};", view);
        })
            .join("\n\t");
        return properties.concat(addSchemaAllOf((_c = schema.allOf) !== null && _c !== void 0 ? _c : null, swagger, areNullableStringsEnabled));
    }
    else if (schema.type === "object" &&
        !!Object.keys((_d = schema === null || schema === void 0 ? void 0 : schema.additionalProperties) !== null && _d !== void 0 ? _d : {}).length) {
        const type = renderProperties(swagger, areNullableStringsEnabled)(schema.additionalProperties);
        const isNullable = schema.additionalProperties.nullable &&
            //TODO rest of condition will be remove, when areNullableStringsEnabled will be deprecated
            (type !== "string" || (type === "string" && areNullableStringsEnabled));
        return (0, mustache_1.render)(isNullable
            ? "{[key: string | number]: {{{type}}}} | null"
            : "{[key: string | number]: {{{type}}}}", { type });
    }
    else if (schema.enum) {
        return schema.enum.map(e => `${e} = "${e}"`).join(",\n\t");
    }
    else if (schema.allOf && schema.allOf[0]) {
        const allOf = schema.allOf[0];
        if (allOf.$ref) {
            const typeName = (0, Common_1.getTypeNameFromRef)(allOf.$ref);
            const tt = swagger.components.schemas[typeName];
            if (schema.type === "object") {
                return renderProperties(swagger, areNullableStringsEnabled)(tt);
            }
            else if (tt.type === "object") {
                return typeName;
            }
            return `typeof ${typeName}`;
        }
        if (allOf.enum) {
            return allOf.enum.map(e => e).join(" | ");
        }
        if (allOf.type === "object") {
            return "any";
        }
        return "any";
    }
    else if (schema.type) {
        switch (schema.type) {
            case "integer":
                return "number";
            case "object":
                return "unknown";
            case "array":
                const arrayTypeSchema = purify_ts_1.Maybe.fromNullable(schema.items)
                    .chain(e => (e instanceof Array ? (0, purify_ts_1.Just)(e[0]) : (0, purify_ts_1.Just)(e)))
                    .chain(e => (0, purify_ts_1.Just)(e.$ref
                    ? (0, Common_1.getTypeNameFromRef)(e.$ref)
                    : renderProperties(swagger, areNullableStringsEnabled)(e)))
                    .orDefault("");
                return `${arrayTypeSchema}[]`;
            default:
                return (schema.type || schema.allOf);
        }
    }
    else if (schema.$ref) {
        return schema.$ref.split("/").reverse()[0];
    }
    else if (schema.oneOf) {
        const oneOf = schema.oneOf;
        return oneOf
            .map(e => renderProperties(swagger, areNullableStringsEnabled)(e))
            .join(" | ");
    }
    else {
        return "any";
    }
};
const generateContracts = (swaggerSchema, areNullableStringsEnabled) => {
    var _a;
    const rp = renderProperties(swaggerSchema, areNullableStringsEnabled);
    const rows = Object.keys(((_a = swaggerSchema.components) === null || _a === void 0 ? void 0 : _a.schemas) || [])
        .map(k => {
        const o = swaggerSchema.components.schemas[k];
        const view = {
            name: k,
            properties: rp(o),
        };
        if (o.enum) {
            return (0, mustache_1.render)(`export enum {{ name }} {\n\t{{{ properties }}}\n}\n`, view);
        }
        if (o.type === "object") {
            return view.properties.length > 0 && view.properties !== "unknown"
                ? (0, mustache_1.render)(`export type {{ name }} = {\n\t{{{ properties }}}\n};\n`, view)
                : (0, mustache_1.render)(`export type {{ name }} {};\n`, view);
        }
        return (0, mustache_1.render)(`export const {{ name }} = {{{ properties }}};\n`, view);
    })
        .join("\n");
    return (0, mustache_1.render)("{{{ rows }}}", { rows });
};
exports.generateContracts = generateContracts;
