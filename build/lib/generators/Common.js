"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeNameFromRef = void 0;
const getTypeNameFromRef = (ref) => ref === null || ref === void 0 ? void 0 : ref.split("/").reverse()[0];
exports.getTypeNameFromRef = getTypeNameFromRef;
