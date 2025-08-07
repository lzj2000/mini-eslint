import { config } from './types';

// 默认配置，包含规则和其他可能的配置项
export const defaultConfig: config = {
    rules: {
        "no-unused-vars": "error",
        "semi": "warn"
    }
};