import { getVirtualID, isRealItem, LogTopic } from '../../common/data_types';
import { Coordinator, TypeaheadOptions } from '../Common';
import LogTopicEditor from '../LogTopic/LogTopicEditor';

const CREATE_ITEM = {
    __type__: 'log-topic',
    __id__: getVirtualID(),
    name: 'Create New Topic ...',
    getItem(_option, parentLogTopic) {
        return new Promise((resolve) => {
            Coordinator.invoke('modal-editor', {
                dataType: 'log-topic',
                EditorComponent: LogTopicEditor,
                valueKey: 'logTopic',
                value: LogTopic.createVirtual({ parentLogTopic }),
                onClose: (newLogTopic) => {
                    if (newLogTopic && isRealItem(newLogTopic)) {
                        resolve(newLogTopic);
                    } else {
                        resolve(null);
                    }
                },
            });
        });
    },
};

class LogTopicTreeOptions {
    static get({
        allowCreation, rootLogTopic, beforeSelect, afterSelect,
    } = {}) {
        return new TypeaheadOptions({
            serverSideOptions: [{ name: 'log-topic', where: { rootLogTopic } }],
            suffixOptions: [allowCreation ? CREATE_ITEM : null].filter((item) => !!item),
            onSelect: async (option) => {
                if (option.getItem) {
                    if (beforeSelect) beforeSelect();
                    const result = await option.getItem(option, rootLogTopic);
                    if (afterSelect) afterSelect();
                    return result;
                }
                return undefined;
            },
        });
    }
}

export default LogTopicTreeOptions;
