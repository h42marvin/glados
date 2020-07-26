import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { RiLoaderLine } from 'react-icons/ri';
import {
    MdCheckCircle, MdFavorite, MdFavoriteBorder, MdSearch,
} from 'react-icons/md';
import {
    Coordinator, ScrollableSection, TextEditor, TypeaheadSelector, debounce,
} from '../Common';

import './DetailsSection.css';

class DetailsSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: null,
            isDirty: false,
        };
        this.saveDebounced = debounce(this.saveNotDebounced, 500);
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate(prevProps) {
        const left = this.props.item;
        const right = this.state.item;
        if (!left && right) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ item: null });
        }
        if (left && (!right || left.__type__ !== right.__type__ || left.id !== right.id)) {
            window.api.send(`${left.__type__}-load`, left)
                .then((item) => this.setState({ item }, this.afterUpdate));
        }
    }

    onChange(item) {
        Coordinator.invoke('details', item);
        this.setState({ item }, this.afterUpdate);
    }

    onUpdate(name, value) {
        this.setState((state) => {
            state.item[name] = value;
            state.isDirty = true;
            return state;
        }, this.saveDebounced);
    }

    saveNotDebounced() {
        const { item } = this.state;
        this.setState({ isDirty: true });
        window.api.send(`${item.__type__}-upsert`, item)
            .then((newItem) => this.setState({ isDirty: false, item: newItem }));
    }

    renderHeader() {
        const { item } = this.state;
        if (item && item.__type__ === 'log-event') {
            const logEvent = this.state.item;
            return (
                <TextEditor
                    isSingleLine
                    unstyled
                    disabled
                    value={logEvent.title}
                />
            );
        }
        if (item && item.__type__ === 'log-topic') {
            const logTopic = this.state.item;
            return (
                <InputGroup>
                    <Button
                        onClick={() => Coordinator.invoke('topic-select', logTopic)}
                        title="Search"
                    >
                        <MdSearch />
                    </Button>
                    <Button
                        onClick={() => this.onUpdate('onSidebar', !logTopic.onSidebar)}
                        title="Favorite?"
                    >
                        {logTopic.onSidebar ? <MdFavorite /> : <MdFavoriteBorder />}
                    </Button>
                    <TypeaheadSelector
                        dataType="log-topic"
                        value={logTopic}
                        disabled={this.props.disabled}
                        onChange={(newItem) => this.onChange(newItem)}
                    />
                    <Button title="Status">
                        {this.state.isDirty ? <RiLoaderLine /> : <MdCheckCircle />}
                    </Button>
                </InputGroup>
            );
        }
        return (
            <InputGroup>
                <TypeaheadSelector
                    dataType="log-topic"
                    value={null}
                    disabled={this.props.disabled}
                    onChange={(newItem) => this.onChange(newItem)}
                    placeholder="Topic Details ..."
                />
            </InputGroup>
        );
    }

    renderDetails() {
        if (!this.state.item) {
            return null;
        }
        return (
            <div>
                <TextEditor
                    unstyled
                    value={this.state.item.details}
                    onChange={(details) => this.onUpdate('details', details)}
                    serverSideTypes={['log-topic']}
                />
            </div>
        );
    }

    render() {
        return (
            <div className="details-section">
                <div className="mb-1">
                    {this.renderHeader()}
                </div>
                <ScrollableSection padding={20 + 4}>
                    {this.renderDetails()}
                </ScrollableSection>
            </div>
        );
    }
}

DetailsSection.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    item: PropTypes.any,
    disabled: PropTypes.bool,
};

DetailsSection.defaultProps = {
    disabled: false,
};

export default DetailsSection;
