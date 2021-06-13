import assert from 'assert';
import React from 'react';
import { eachDayOfInterval, getDay } from 'date-fns';
import PropTypes from '../prop-types';
import DateUtils from '../../common/DateUtils';
import {
    Coordinator, TypeaheadOptions,
} from '../Common';
import LogEventEditor from './LogEventEditor';
import LogEventList from './LogEventList';
import { getVirtualID, LogEvent } from '../../data';

const INCOMPLETE_ITEM = {
    __type__: 'incomplete',
    id: getVirtualID(),
    name: 'Incomplete Events',
};
const ALL_EVENTS_ITEM = {
    __type__: 'all-events',
    id: getVirtualID(),
    name: 'All Events',
};

const EVENT_TITLE_ITEM_TYPE = 'log-event-title';
const EVENT_TITLE_ITEM_PREFIX = 'Title: ';

const SPECIAL_ITEMS = [
    INCOMPLETE_ITEM,
    ALL_EVENTS_ITEM,
];

function getDayOfTheWeek(label) {
    return DateUtils.DaysOfTheWeek[getDay(DateUtils.getDate(label))];
}

class LogEventSearch extends React.Component {
    static getTypeaheadOptions(logMode) {
        const where = { logMode: logMode || undefined };
        return new TypeaheadOptions({
            serverSideOptions: [
                { name: 'log-topic', args: { where } },
                { name: 'log-structure', args: { where } },
            ],
            prefixOptions: SPECIAL_ITEMS,
            computedOptionTypes: [EVENT_TITLE_ITEM_TYPE],
            getComputedOptions: (query) => {
                const options = [];
                if (query) {
                    options.push({
                        __type__: EVENT_TITLE_ITEM_TYPE,
                        id: getVirtualID(),
                        name: EVENT_TITLE_ITEM_PREFIX + query,
                    });
                }
                return options;
            },
            onSelect: (option) => {
                if (option && option.getItem) {
                    return option.getItem(option);
                }
                return undefined;
            },
        });
    }

    static getDerivedStateFromProps(props, state) {
        const signature = JSON.stringify([
            props.logMode,
            props.dateRange,
            props.search,
            state.dateRange,
        ]);
        if (state.signature === signature) {
            return state;
        }
        state.signature = signature;

        let dates;
        if (props.dateRange) {
            dates = eachDayOfInterval({
                start: DateUtils.getDate(props.dateRange.startDate),
                end: DateUtils.getDate(props.dateRange.endDate),
            }).map((date) => DateUtils.getLabel(date));
        }

        const where = {
            logMode: props.logMode || undefined,
            isComplete: true,
            logLevel: [2, 3],
        };
        let dateSearch = false;
        props.search.forEach((item) => {
            if (item.__type__ === 'log-structure') {
                assert(!where.logStructure);
                where.logStructure = item;
                dateSearch = true;
            } else if (item.__type__ === 'log-topic') {
                if (!where.logTopics) {
                    where.logTopics = [];
                }
                where.logTopics.push(item);
                dateSearch = true;
            } else if (item.__type__ === INCOMPLETE_ITEM.__type__) {
                where.isComplete = false;
                dateSearch = true;
            } else if (item.__type__ === ALL_EVENTS_ITEM.__type__) {
                delete where.logLevel;
            } else if (item.__type__ === EVENT_TITLE_ITEM_TYPE) {
                where.name = item.name.substring(EVENT_TITLE_ITEM_PREFIX.length);
                dateSearch = true;
            } else {
                assert(false, item);
            }
        });
        state.where = where;
        if (dates || dateSearch) {
            state.dates = dates;
            state.dateSearch = !dates;
            state.defaultDisplay = false;
        } else {
            state.dates = null;
            state.dateSearch = false;
            state.defaultDisplay = true;
        }
        return state;
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.deregisterCallbacks = [
            Coordinator.subscribe('log-event-created', (logEvent) => {
                if (logEvent.logLevel === 1 && !this.props.search.length) {
                    Coordinator.invoke('url-update', { search: [ALL_EVENTS_ITEM] });
                }
            }),
        ];
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        if (this.state.dateSearch) {
            const where = { ...this.state.where, date: this.state.dates };
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ dateSearch: false, dates: null });
            window.api.send('log-event-dates', { where })
                // eslint-disable-next-line react/no-did-update-set-state
                .then((result) => this.setState({ dates: result }));
        }
    }

    componentWillUnmount() {
        this.deregisterCallbacks.forEach((deregisterCallback) => deregisterCallback());
    }

    render() {
        if (this.state.defaultDisplay ? false : !this.state.dates) {
            return null; // Loading ...
        }
        const { where } = this.state;
        const moreProps = { viewerComponentProps: {} };
        moreProps.prefixActions = [];
        moreProps.prefixActions.push({
            id: 'duplicate',
            name: 'Duplicate',
            perform: (logEvent) => {
                Coordinator.invoke('modal-editor', {
                    dataType: 'log-event',
                    EditorComponent: LogEventEditor,
                    valueKey: 'logEvent',
                    value: LogEvent.createVirtual({
                        ...logEvent,
                        date: DateUtils.getTodayLabel(),
                    }),
                });
            },
        });
        if (!where.logLevel && !where.logMode) {
            moreProps.allowReordering = true;
            moreProps.viewerComponentProps.displayLogLevel = true;
        }
        if (this.state.defaultDisplay) {
            const today = DateUtils.getTodayLabel();
            const upcomingMoreProps = {
                ...moreProps,
                viewerComponentProps: { ...moreProps.viewerComponentProps },
                prefixActions: [...moreProps.prefixActions],
            };
            upcomingMoreProps.viewerComponentProps.displayDate = true;
            upcomingMoreProps.prefixActions.push({
                id: 'complete',
                name: 'Complete',
                perform: (logEvent) => {
                    window.api.send('log-event-upsert', {
                        ...logEvent,
                        date: DateUtils.getTodayLabel(),
                        isComplete: true,
                    });
                },
            });
            return (
                <>
                    <LogEventList
                        name="Done (Today)"
                        where={{ date: today, ...where, isComplete: true }}
                        showAdder
                        {...moreProps}
                    />
                    <div className="mt-4" />
                    <LogEventList
                        name="Todo (Today)"
                        where={{
                            date: today, ...where, isComplete: false,
                        }}
                        showAdder
                        {...moreProps}
                    />
                    <div className="mt-4" />
                    <LogEventList
                        name="Todo (Overdue)"
                        where={{
                            date: today, ...where, isComplete: false, dateOp: 'lt',
                        }}
                        {...upcomingMoreProps}
                    />
                    <div className="mt-4" />
                    <LogEventList
                        name="Todo (Upcoming)"
                        where={{
                            date: today, ...where, isComplete: false, dateOp: 'gt',
                        }}
                        {...upcomingMoreProps}
                    />
                </>
            );
        }
        return this.state.dates.map((date) => {
            let name = 'Unspecified';
            if (date) {
                name = `${date} ${getDayOfTheWeek(date)}`;
            }
            return (
                <LogEventList
                    key={date || 'null'}
                    name={name}
                    where={{ date, ...where }}
                    {...moreProps}
                />
            );
        });
    }
}

LogEventSearch.propTypes = {
    logMode: PropTypes.Custom.LogMode,
    dateRange: PropTypes.Custom.DateRange,
    search: PropTypes.arrayOf(PropTypes.Custom.Item.isRequired).isRequired,
};

export default LogEventSearch;
