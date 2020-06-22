import React from 'react';
import { LogEntry } from '../../data';
import PropTypes from '../prop-types';
import { TextEditor } from '../Common';

const TextEditorSources = [
    { trigger: '@', dataType: 'log-tag' },
    { trigger: '#', dataType: 'log-tag' },
];

const AugmentedTextEditorSources = [
    ...TextEditorSources,
    { trigger: '!', dataType: 'log-entry' },
];

function LogEntryTitleEditor(props) {
    const {
        logEntry, onUpdate, onMajorUpdate, ...moreProps
    } = props;
    return (
        <TextEditor
            isSingleLine
            value={logEntry.title}
            sources={AugmentedTextEditorSources}
            disabled={!!logEntry.logCategory.template}
            onUpdate={(value) => {
                const updatedLogEntry = { ...logEntry };
                updatedLogEntry.title = value;
                LogEntry.trigger(updatedLogEntry);
                onUpdate(updatedLogEntry);
            }}
            onSelectSuggestion={(option) => {
                if (typeof option.title === 'undefined') return;
                const updatedLogEntry = option;
                updatedLogEntry.id = logEntry.id;
                LogEntry.trigger(logEntry);
                (onMajorUpdate || onUpdate)(updatedLogEntry);
            }}
            {...moreProps}
        />
    );
}

LogEntryTitleEditor.propTypes = {
    logEntry: PropTypes.Custom.LogEntry.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onMajorUpdate: PropTypes.func,
};

export { TextEditorSources };
export default LogEntryTitleEditor;
