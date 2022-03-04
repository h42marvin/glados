import Enum from './enum';
import { getVirtualID } from './utils';
import { validateNonEmptyString } from './validation';

const LogStructureKeyType = Enum([
    {
        value: 'string',
        label: 'String',
        validator: async () => true,
        getDefault: () => '',
    },
    {
        value: 'string_list',
        label: 'String List',
        validator: async (value) => Array.isArray(value),
        getDefault: () => [],
    },
    {
        value: 'integer',
        label: 'Integer',
        validator: async (value) => !!value.match(/^\d+$/),
        getDefault: () => '',
    },
    {
        value: 'number',
        label: 'Number',
        validator: async (value) => !!value.match(/^\d+(?:\.\d+)?$/),
        getDefault: () => '',
    },
    {
        value: 'time',
        label: 'Time',
        validator: async (value) => !!value.match(/^\d{2}:\d{2}$/),
        getDefault: () => '',
    },
    {
        value: 'yes_or_no',
        label: 'Yes / No',
        validator: async (value) => !!value.match(/^(?:yes|no)$/),
        getDefault: () => 'no',
    },
    {
        value: 'enum',
        label: 'Enum',
        validator: async (value, logKey) => logKey.enumValues.includes(value),
        getDefault: (logKey) => logKey.enumValues[0],
    },
    {
        value: 'log_topic',
        label: 'Topic',
        validator: async (value, logKey, that) => {
            const logTopic = await that.invoke.call(that, 'log-topic-load', value);
            return logTopic.parentLogTopic.__id__ === logKey.parentLogTopic.__id__;
        },
        getDefault: () => null,
    },
    {
        value: 'log_topic_tree',
        label: 'Topic tree',
        validator: async (value, logKey, that) => {
            const logTopic = await that.invoke.call(that, 'log-topic-tree-load', value);
            return typeof logTopic.logTopicTree[logKey.rootLogTopic.__id__] !== 'undefined';
        },
        getDefault: () => null,
    },
    {
        value: 'rich_text_line',
        label: 'Rich Text Line',
        validator: async (value) => true,
        getDefault: () => null,
    },
]);

class LogStructureKey {
    static createVirtual() {
        return {
            __type__: 'log-structure-key',
            __id__: getVirtualID(),
            name: '',
            type: LogStructureKeyType.STRING,
            isOptional: false,
            template: null,
            enumValues: [],
            parentLogTopic: null,
            rootLogTopic: null,
        };
    }

    static async validate(inputLogKey) {
        const results = [];
        results.push(validateNonEmptyString('.name', inputLogKey.name));
        results.push(validateNonEmptyString('.type', inputLogKey.type));
        if (inputLogKey.type === LogStructureKeyType.ENUM) {
            results.push([
                '.enumValues',
                inputLogKey.enumValues.length > 0,
                'must be provided!',
            ]);
        } if (inputLogKey.type === LogStructureKeyType.LOG_TOPIC) {
            results.push([
                '.parentLogTopic',
                inputLogKey.parentLogTopic,
                'must be provided!',
            ]);
        } if (inputLogKey.type === LogStructureKeyType.LOG_TOPIC_TREE) {
            results.push([
                '.rootLogTopic',
                inputLogKey.rootLogTopic,
                'must be provided!',
            ]);
        }
        return results;
    }

    static async load(rawLogKey, index) {
        let parentLogTopic = null;
        let rootLogTopic = null;
        if (rawLogKey.parent_topic_id) {
            // Normally, we would use "log-topic-load" here, but it does a lot of extra work.
            const logTopic = await this.database.findByPk('LogTopic', rawLogKey.parent_topic_id);
            parentLogTopic = {
                __type__: 'log-topic',
                __id__: logTopic.id,
                name: logTopic.name,
            };
        }
        if (rawLogKey.root_topic_id) {
            const logTopic = await this.database.findByPk('LogTopic', rawLogKey.root_topic_id);
            rootLogTopic = {
                __type__: 'log-topic-tree',
                __id__: logTopic.id,
                name: logTopic.name,
            };
        }

        return {
            __type__: 'log-structure-key',
            __id__: index,
            name: rawLogKey.name,
            type: rawLogKey.type,
            template: rawLogKey.template || null,
            isOptional: rawLogKey.is_optional || false,
            enumValues: rawLogKey.enum_values || [],
            parentLogTopic,
            rootLogTopic,
        };
    }

    static save(inputLogKey) {
        const result = {
            name: inputLogKey.name,
            type: inputLogKey.type,
        };
        if (inputLogKey.isOptional) {
            result.is_optional = true;
        }
        if (inputLogKey.template) {
            result.template = inputLogKey.template;
        }
        if (inputLogKey.type === LogStructureKeyType.ENUM && inputLogKey.enumValues) {
            result.enum_values = inputLogKey.enumValues;
        }
        if (inputLogKey.type === LogStructureKeyType.LOG_TOPIC && inputLogKey.parentLogTopic) {
            result.parent_topic_id = inputLogKey.parentLogTopic.__id__;
        }
        if (inputLogKey.type === LogStructureKeyType.LOG_TOPIC_TREE && inputLogKey.rootLogTopic) {
            result.root_topic_id = inputLogKey.rootLogTopic.__id__;
        }
        return result;
    }
}

LogStructureKey.Type = LogStructureKeyType;

export default LogStructureKey;
