import Utils from './Utils';

beforeEach(Utils.beforeEach);
afterEach(Utils.afterEach);

test('test_structure_constraint', async () => {
    await Utils.loadData({
        logStructures: [
            {
                name: 'Animals',
                logKeys: [
                    { name: 'Size', type: 'string' },
                    { name: 'Legs', type: 'integer' },
                ],
            },
        ],
        logEntries: [
            {
                date: '2020-06-28',
                title: 'Cat',
                structure: 'Animals',
                logValues: ['small', '4'],
            },
        ],
    });

    const actions = Utils.getActions();
    await expect(() => actions.invoke('log-structure-delete', 1)).rejects.toThrow();
    await actions.invoke('log-entry-delete', 1);
    await actions.invoke('log-structure-delete', 1);
});

test('test_entry_update', async () => {
    await Utils.loadData({
        logStructures: [
            {
                name: 'Animals',
                logKeys: [
                    { name: 'Size', type: 'string' },
                    { name: 'Legs', type: 'integer' },
                ],
            },
        ],
        logEntries: [
            {
                date: '2020-06-28',
                title: 'Cat',
                structure: 'Animals',
                logValues: ['small', '4'],
            },
        ],
    });

    const actions = Utils.getActions();

    const logEntry = await actions.invoke('log-entry-load', { id: 1 });
    logEntry.title = 'Dog';
    logEntry.logStructure.logKeys[0].value = 'medium';
    await actions.invoke('log-entry-upsert', logEntry);
});

test('test_log_entry_value_typeahead', async () => {
    await Utils.loadData({
        logStructures: [
            {
                name: 'Animals',
                logKeys: [
                    { name: 'Size', type: 'string' },
                    { name: 'Legs', type: 'integer' },
                ],
            },
        ],
        logEntries: [
            {
                date: '2020-06-28',
                title: 'Cat',
                structure: 'Animals',
                logValues: ['small', '4'],
            },
        ],
    });

    const actions = Utils.getActions();
    let logValueSuggestions;

    const logEntry = await actions.invoke('log-entry-load', { id: 1 });
    const input = { structure_id: logEntry.logStructure.id, index: null, query: '' };

    logValueSuggestions = await actions.invoke('value-typeahead', { ...input, index: 0 });
    expect(logValueSuggestions).toEqual(['small']);

    logValueSuggestions = await actions.invoke('value-typeahead', { ...input, index: 1 });
    expect(logValueSuggestions).toEqual(['4']);
});
