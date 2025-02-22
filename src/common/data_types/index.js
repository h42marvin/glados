import LogEvent from './LogEvent';
import LogStructure from './LogStructure';
import LogStructureGroup from './LogStructureGroup';
import LogTopic from './LogTopic';

export {
    LogTopic,
    LogStructureGroup,
    LogStructure,
    LogEvent,
};

const Mapping = {
    'log-topic': LogTopic,
    'log-structure-group': LogStructureGroup,
    'log-structure': LogStructure,
    'log-event': LogEvent,
};

export function getDataTypeMapping() {
    return Mapping;
}

export { default as Enum } from './enum';
export * from './utils';
