import { Rule, Rules } from '../types';
import NoUnusedVars from './no-unused-vars';
import Semi from './semi';

const rules = [
    NoUnusedVars,
    Semi
]

/**
 * 过滤规则，根据配置返回应该启用的规则
 * @param rules 规则数组
 * @param config 规则配置对象
 * @returns 启用的规则数组
 */
function filterRules(rules: Rule[], config: Rules): Rule[] {
    return rules
        .filter((rule) => {
            const level = config[rule.meta.name];

            return level !== 'off';
        })
}

export function loadRules(config: Rules) {
    return filterRules(rules, config);
}