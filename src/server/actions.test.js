import Database from './database';
import Actions from './actions';

let database = null;

beforeAll(async () => {
    const config = {
        "type": "sqlite",
        "host": "localhost",
        "username": "productivity_test",
        "password": "productivity_test",
        "name": "productivity_test"
    };
    database = await Database.init(config);
});

afterAll(async () => {
    if (database) await database.close();
});

async function invoke(name, ...args) {
    return await Actions[name].call({database}, ...args);
}

test("category_update", async () => {
    let cat1 = await invoke("category-update", {
        id: -1,
        name: "Animals",
        lsdKeys: [
            {id: -1, name: "Size", valueType: "string"},
            {id: -2, name: "Legs", valueType: "integer"},
        ],
    });
    let cat2 = await invoke("category-update", {
        id: -1,
        name: "Vehicles",
        lsdKeys: [
            {id: -2, name: "Medium", valueType: "string"},
            {id: -1, name: "Size", valueType: "string"},
        ],
    });
    expect(await invoke("category-list")).toEqual([
        {
            "id": 1,
            "name": "Animals",
            "lsdKeys": [
                {
                    "id": 1,
                    "name": "Size",
                    "valueType": "string"
                },
                {
                    "id": 2,
                    "name": "Legs",
                    "valueType": "integer"
                }
            ]
        },
        {
            "id": 2,
            "name": "Vehicles",
            "lsdKeys": [
                {
                    "id": 3,
                    "name": "Medium",
                    "valueType": "string"
                },
                {
                    "id": 1,
                    "name": "Size",
                    "valueType": "string"
                }
            ]
        }
    ]);

    cat2.name = "Machines";
    cat2.lsdKeys = [{id: -1, name: "Size", valueType: "integer"}];
    cat2 = await invoke("category-update", cat2);
    expect(cat2.name).toEqual("Machines"); // updated
    expect(cat2.lsdKeys[0].id).toEqual(1); // updated
    expect(cat2.lsdKeys[0].valueType).toEqual("string"); // unchanged

    // SequelizeForeignKeyConstraintError
    expect(() => database.delete('LSDKey', {id: 2})).rejects.toThrow();
    await invoke("category-delete", cat1);
    await database.delete('LSDKey', {id: 2});
});

if(0) test("basic_operations", async () => {
    const models = actions.database.models;

    const key1 = await actions.genCreateLSDKey({name: 'Size', value_type: 'string'});
    const key2 = await actions.genCreateLSDKey({name: 'Legs', value_type: 'integer'});
    const category = await actions.genCreateCategory({name: 'Animal'});
    await actions.genSetCategoryKeys({category_id: category.id, lsd_key_ids: [key1.id, key2.id]});
    await expect(() => key1.destroy()).rejects.toThrow(); // SequelizeForeignKeyConstraintError
    await expect(() => category.destroy()).rejects.toThrow(); // SequelizeForeignKeyConstraintError

    const log1 = await actions.genCreateLogEntry({
        title: 'Cat',
        details: 'Meow!',
        category_id: category.id,
        lsd_values: [
            {lsd_key_id: key1.id, value_data: 'small'},
            {lsd_key_id: key2.id, value_data: '4'},
        ],
    });
    const log2 = await actions.genCreateLogEntry({
        title: 'Dog',
        details: 'Bark!',
        category_id: category.id,
        lsd_values: [
            {lsd_key_id: key1.id, value_data: 'medium'},
            {lsd_key_id: key2.id, value_data: '4'},
        ],
    });
    expect((await models.LogEntryToLSDValue.findAll()).length).toEqual(4);
    await log1.destroy();
    expect((await models.LogEntryToLSDValue.findAll()).length).toEqual(2);
    expect((await models.LSDValue.findAll()).length).toEqual(3);
});
