
import Editor from 'draft-js-plugins-editor';
import { RichUtils } from 'draft-js';
import PropTypes from 'prop-types';
import React from 'react';

// Using a local copy of the plugin until the PR is merged.
// https://github.com/draft-js-plugins/draft-js-plugins/pull/1419
// cp -r ../draft-js-plugins/draft-js-mention-plugin src/client/Common
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';
import createSingleLinePlugin from 'textio-draft-js-single-line-plugin';
import createMentionPlugin, { defaultSuggestionsFilter } from './draft-js-mention-plugin/src';

import assert from '../../common/assert';
import TextEditorUtils from '../../common/TextEditorUtils';
import Utils from '../../data/Utils';

import 'draft-js/dist/Draft.css';

class TextEditor extends React.Component {
    static getDerivedStateFromProps(props, state) {
        if (!state.editorState || props.value !== state.value) {
            // eslint-disable-next-line no-param-reassign
            state.value = props.value;
            // eslint-disable-next-line no-param-reassign
            state.editorState = TextEditorUtils.toEditorState(
                TextEditorUtils.deserialize(props.value),
            );
        }
        return state;
    }

    constructor(props) {
        super(props);
        this.state = {
            suggestions: [],
            open: false,
            plugins: [],
        };

        if (this.props.isMarkdown) {
            this.markdownShortcutsPlugin = createMarkdownShortcutsPlugin();
            this.state.plugins.push(this.markdownShortcutsPlugin);
        }

        this.mentionPlugin = createMentionPlugin({
            mentionTriggers: this.props.sources.map((suggestion) => suggestion.trigger),
        });
        this.state.plugins.push(this.mentionPlugin);

        if (this.props.isSingleLine) {
            this.singleLinePlugin = createSingleLinePlugin({
                stripEntities: false,
            });
            this.state.plugins.push(this.singleLinePlugin);
        }
    }

    onSearchChange({ trigger, value: query }) {
        const selectedSource = this.props.sources
            .find((suggestion) => suggestion.trigger === trigger);
        assert(selectedSource, 'unknown suggestion for trigger');
        this.setState({selectedSource});
        if (selectedSource.options) {
            this.setSuggestions(selectedSource, query, selectedSource.options);
        } else if (selectedSource.dataType) {
            window.api.send(selectedSource.dataType + '-typeahead', { trigger, query })
                .then((options) => this.setSuggestions(selectedSource, query, options));
        } else {
            assert(false, 'missing source');
        }
    }

    onAddMention(option) {
        if (this.props.onSelectSuggestion) {
            if (option[Utils.INCOMPLETE_KEY]) {
                assert(this.state.selectedSource.dataType);
                window.api.send(this.state.selectedSource.dataType + '-load', option)
                    .then((logEntry) => this.props.onSelectSuggestion(logEntry));
            } else {
                this.props.onSelectSuggestion(option);
            }
        }
    }

    onChange(editorState) {
        this.setState({ editorState });
        const oldValue = this.props.value;
        const newValue = TextEditorUtils.serialize(
            TextEditorUtils.fromEditorState(editorState),
        );
        if (oldValue === newValue) {
            this.props.onUpdate(newValue);
        }
    }

    setSuggestions(source, query, options) {
        // Excepted Structure = [{name, link, avatar}]
        this.setState({
            open: true,
            suggestions: defaultSuggestionsFilter(query, options),
        });
    }

    handleKeyCommand(command, editorState) {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }

    render() {
        const { MentionSuggestions } = this.mentionPlugin;
        return (
            <div className={`text-editor ${this.props.disabled ? 'text-editor-disabled' : ''}`}>
                <Editor
                    readOnly={this.props.disabled}
                    editorState={this.state.editorState}
                    handleKeyCommand={
                        (command, editorState) => this.handleKeyCommand(command, editorState)
                    }
                    blockRenderMap={
                        this.props.isSingleLine
                            ? this.singleLinePlugin.blockRenderMap
                            : undefined
                    }
                    plugins={this.state.plugins}
                    onChange={(editorState) => this.onChange(editorState)}
                />
                <div className="mention-suggestions">
                    <MentionSuggestions
                        open={this.state.open}
                        onOpenChange={(open) => this.setState({ open })}
                        onSearchChange={(data) => this.onSearchChange(data)}
                        onAddMention={(option) => this.onAddMention(option)}
                        suggestions={this.state.suggestions}
                    />
                </div>
            </div>
        );
    }
}

TextEditor.propTypes = {
    disabled: PropTypes.bool,
    value: PropTypes.string.isRequired,
    isMarkdown: PropTypes.bool,
    isSingleLine: PropTypes.bool,
    sources: PropTypes.arrayOf(
        PropTypes.shape({
            trigger: PropTypes.string.isRequired,
            options: PropTypes.arrayOf(PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
            }).isRequired),
            dataType: PropTypes.string,
        }).isRequired,
    ),
    onSelectSuggestion: PropTypes.func,
    onUpdate: PropTypes.func.isRequired,
};

TextEditor.defaultProps = {
    disabled: false,
    isSingleLine: false,
    isMarkdown: false,
    sources: [],
};

export default TextEditor;
