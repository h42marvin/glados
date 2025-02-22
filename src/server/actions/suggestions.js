/* eslint-disable func-names */

import assert from 'assert';

import { LogStructure } from '../../common/data_types';

const ActionsRegistry = {};

ActionsRegistry['value-typeahead-index-$cached'] = async function (input) {
    const getOrDefault = (item, key, defaultValue) => {
        if (!(key in item)) item[key] = defaultValue;
        return item[key];
    };
    const getValues = (logKey) => {
        if (!logKey.value) {
            return [];
        }
        if (logKey.type === LogStructure.Key.Type.STRING_LIST) {
            assert(Array.isArray(logKey.value));
            return logKey.value;
        }
        if (logKey.type === LogStructure.Key.Type.LOG_TOPIC) {
            return [logKey.value.__id__];
        }
        return [logKey.value];
    };

    const where = { logStructure: { __id__: input.structure_id } };
    const outputLogEvents = await this.invoke.call(this, 'log-event-list', { where });
    if (!outputLogEvents.length) {
        return null;
    }
    const structureIndexData = {}; // Map<key_id, Structure[LogKey, List<LogValues>]>
    outputLogEvents.forEach((outputLogEvent) => {
        outputLogEvent.logStructure.logKeys.forEach((logKey, index) => {
            const keyIndexData = getOrDefault(structureIndexData, index, { logKey, counts: {} });
            getValues(logKey).forEach((value) => {
                getOrDefault(keyIndexData.counts, value, 0);
                keyIndexData.counts[value] += 1;
            });
        });
    });
    Object.values(structureIndexData).forEach((keyIndexData) => {
        keyIndexData.values = Array.from(Object.entries(keyIndexData.counts))
            .sort((left, right) => left[1] - right[1])
            .map((pair) => pair[0]);
        delete keyIndexData.counts;
    });
    return structureIndexData;
};

ActionsRegistry['value-typeahead'] = async function (input) {
    const structureIndexData = await this.invoke.call(
        this,
        'value-typeahead-index',
        { structure_id: input.logStructure.__id__ },
    );
    if (!structureIndexData) return [];
    const keyIndexData = structureIndexData[input.index];
    if (!keyIndexData) return [];
    return keyIndexData.values.filter((value) => value.startsWith(input.query));
};

export default ActionsRegistry;
