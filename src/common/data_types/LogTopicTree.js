import RichTextUtils from '../RichTextUtils';
import DataTypeBase from './base';
import { getVirtualID } from './utils';
import { validateNonEmptyString } from './validation';

class LogTopicTree extends DataTypeBase {
    static createVirtual({ logTopicTree = null, name = '' } = {}) {
        return {
            __type__: 'log-topic-tree',
            __id__: getVirtualID(),
            logTopicTree,
            name,
            details: null,
            childCount: 0,
            isFavorite: false,
            isDeprecated: false,
        };
    }

    static async updateWhere(where) {
        await DataTypeBase.updateWhere.call(this, where, {
            __id__: 'id',
            isFavorite: 'is_favorite',
            isDeprecated: 'is_deprecated',
            parentLogTopic: 'parent_topic_id',
        });
    }

    static async validate(inputLogTopic) {
        const results = [];
        results.push(validateNonEmptyString('.name', inputLogTopic.name));
        return results;
    }

    static async load(id) {
        const logTopic = await this.database.findByPk('LogTopic', id);
        const outputLogTopicTree = await LogTopicTree.findRoot.call(this, logTopic.parent_topic_id);

        return {
            __type__: 'log-topic-tree',
            __id__: logTopic.id,
            logTopicTree: outputLogTopicTree,
            name: logTopic.name,
            details: RichTextUtils.deserialize(
                logTopic.details,
                RichTextUtils.StorageType.DRAFTJS,
            ),
            childCount: logTopic.child_count,
            isFavorite: logTopic.is_favorite,
            isDeprecated: logTopic.is_deprecated,
        };
    }

    static async findRoot(id, rootId = null) {
        let result = [];

        if (id !== null) {
            const logTopic = await this.database.findByPk(
                'LogTopic',
                id,
            );

            if (id !== rootId) {
                result = await LogTopicTree.findRoot.call(this, logTopic.parent_topic_id, rootId);
            }

            result[logTopic.id] = {
                __type__: 'log-topic',
                __id__: logTopic.id,
                name: logTopic.name,
            };
        }

        return result;
    }
}

export default LogTopicTree;
