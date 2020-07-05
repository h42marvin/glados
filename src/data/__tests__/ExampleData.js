export default {
    logTopics: [
        { name: 'Anurag Dubey' },
        { name: 'Kaustubh Karkare' },
        { name: 'Vishnu Mohandas' },
        { name: 'philosophy' },
        { name: 'productivity' },
    ],
    logStructures: [
        {
            name: 'Cycling',
            logKeys: [
                { name: 'Distance (miles)', type: 'integer' },
                { name: 'Time (minutes)', type: 'integer' },
            ],
            titleTemplate: 'Cycling: $1 miles / $2 minutes ({($1*60/$2).toFixed(2)} mph)',
        },
        {
            name: 'Surya Namaskar',
            logKeys: [
                { name: 'Surya Namaskar Count', type: 'integer' },
            ],
            titleTemplate: 'Surya Namaskar: $1',
        },
        {
            name: 'Food',
            logKeys: [
                { name: 'Food Name', type: 'string' },
                { name: 'Food Quantity', type: 'string' },
            ],
            titleTemplate: 'Food: $1 ($2)',
        },
        {
            name: 'Book',
            logKeys: [
                { name: 'Book Name', type: 'string' },
                { name: 'Progress', type: 'string' },
            ],
            titleTemplate: 'Book: $1 ($2)',
        },
        {
            name: 'Movie',
            logKeys: [
                { name: 'Movie Name', type: 'string' },
            ],
            titleTemplate: 'Movie: $1',
        },
        {
            name: 'Television',
            logKeys: [
                { name: 'Show Name', type: 'string' },
                { name: 'Progress', type: 'string' },
            ],
            titleTemplate: 'TV: $1 ($2)',
        },
        {
            name: 'Article',
            logKeys: [
                { name: 'Name', type: 'string' },
                { name: 'Link', type: 'string' },
            ],
            titleTemplate: 'Article: $1',
        },
    ],
    logReminderGroups: [
        {
            name: 'Daily Routine',
            type: 'periodic',
            onSidebar: true,
        },
        {
            name: 'Research',
            type: 'deadline',
        },
        {
            name: 'Entertainment',
            type: 'unspecified',
        },
    ],
    logReminders: [
        {
            title: 'Surya Namaskar',
            group: 'Daily Routine',
            frequency: 'everyday',
            lastUpdate: '2020-06-26',
            structure: 'Surya Namaskar',
            needsEdit: true,
        },
        {
            title: 'Read article about Paxos',
            group: 'Research',
            deadline: '2020-06-30',
            warning: '3 days',
        },
        {
            title: 'Movie some movie!',
            group: 'Entertainment',
        },
    ],
    logEvents: [
        {
            date: '2020-06-22',
            structure: 'Cycling',
            logValues: ['15', '55'],
        },
        {
            date: '2020-06-24',
            structure: 'Cycling',
            logValues: ['15', '60'],
        },
    ],
};
