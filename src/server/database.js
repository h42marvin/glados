import assert from '../common/assert';
const Sequelize = require('sequelize');

function create_models(sequelize) {
    const options = {
        timestamps: false,
        underscored: true,
    };

    const LogCategory = sequelize.define(
        'log_categories',
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
        },
        {
            ...options,
            indexes: [
                {unique: true, fields: ['name']},
            ],
        },
    );

    const LogKey = sequelize.define(
        'log_keys',
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
        },
        {
            ...options,
            indexes: [
                {unique: true, fields: ['name']},
            ],
        },
    );

    const LogCategoryToLogKey = sequelize.define(
        'log_categories_to_log_keys',
        {
            category_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: LogCategory,
                    key: 'id',
                },
            },
            key_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: LogKey,
                    key: 'id',
                },
            },
            ordering_index: {
                type: Sequelize.INTEGER,
                allowNull: false,
            }
        },
        options,
    );

    LogCategory.belongsToMany(LogKey, {
        through: LogCategoryToLogKey,
        foreignKey: 'category_id',
        // Allow the edge to be deleted with the category.
        onDelete: 'cascade',
        onUpdate: 'cascade',
    });

    LogKey.belongsToMany(LogCategory, {
        through: LogCategoryToLogKey,
        foreignKey: 'key_id',
        // Don't allow key to be deleted if there are
        // categories that depend on it.
        onDelete: 'restrict',
        onUpdate: 'restrict',
    });

    const LogValue = sequelize.define(
        'log_values',
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            key_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            data: {
                type: Sequelize.STRING,
                allowNull: false,
            },
        },
        {
            ...options,
            indexes: [
                {unique: true, fields: ['key_id', 'data']},
            ],
        }
    );

    LogKey.hasMany(LogValue, {
        foreignKey: 'key_id',
        onDelete: 'restrict',
        onUpdate: 'restrict',
    });

    const LogEntry = sequelize.define(
        'log_entries',
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            details: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: '',
            },
        },
        options,
    );

    LogCategory.hasMany(LogEntry, {
        foreignKey: 'category_id',
        allowNull: true,
        onDelete: 'restrict',
        onUpdate: 'restrict',
    });

    const LogEntryToLogValue = sequelize.define(
        'log_entries_to_log_values',
        {
            entry_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: LogEntry,
                    key: 'id',
                },
            },
            value_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: LogValue,
                    key: 'id',
                },
            },
            ordering_index: {
                type: Sequelize.INTEGER,
                allowNull: false,
            }
        },
        options,
    );

    LogEntry.belongsToMany(LogValue, {
        through: LogEntryToLogValue,
        foreignKey: 'entry_id',
        // Deleteing an Entry is allowed!
        // The links will be broken, and the Values could be cleaned up.
        onDelete: 'cascade',
        onUpdate: 'cascade',
    });

    LogValue.belongsToMany(LogEntry, {
        through: LogEntryToLogValue,
        foreignKey: 'value_id',
        onDelete: 'restrict',
        onUpdate: 'restrict',
    });

    return {LogCategory, LogKey, LogCategoryToLogKey, LogValue, LogEntry, LogEntryToLogValue};
}

class Database {
    static async init(config) {
        const instance = new Database(config);
        return instance.sequelize.sync({force: false}).then(_ => instance);
    }

    constructor(config) {
        const options = {
            logging: false
        };
        if (config.type == 'mysql') {
            options.dialect = 'mysql';
            options.host = 'localhost';
        } else if (config.type == 'sqlite') {
            options.dialect = 'sqlite';
            options.storage = ':memory:';
        } else {
            assert(false, "unknown database type");
        }
        this.sequelize = new Sequelize(
            config.name,
            config.username,
            config.password,
            options,
        );
        this.models = create_models(this.sequelize);
    }
    async close() {
        await this.sequelize.close();
    }

    async create(name, fields, transaction) {
        const {id, ...remaining_fields} = fields;
        const Model = this.models[name];
        return await Model.create(
            remaining_fields,
            // Why specify fields? https://github.com/sequelize/sequelize/issues/11417
            {fields: Object.keys(remaining_fields), transaction},
        );
    }

    async update(name, fields, transaction) {
        const {id, ...remaining_fields} = fields;
        const Model = this.models[name];
        let instance = await Model.findByPk(id, {transaction});
        return await instance.update(remaining_fields, {transaction});
    }

    async create_or_update(name, fields, transaction) {
        if (typeof fields.id == "undefined" || fields.id < 0) {
            return await this.create(name, fields, transaction);
        } else {
            return await this.update(name, fields, transaction);
        }
    }

    async find(name, where, transaction) {
        const Model = this.models[name];
        return await Model.findOne({where, transaction});
    }

    async create_or_find(name, where, update_fields, transaction) {
        const Model = this.models[name];
        let instance = await Model.findOne({where, transaction});
        if (!instance) {
            return await this.create(name, {...where, ...update_fields}, transaction);
        } else {
            return instance;
        }
    }

    async delete(name, fields, transaction) {
        const Model = this.models[name];
        const {id} = fields;
        let instance = await Model.findByPk(id);
        return await instance.destroy({transaction});
    }

    async get_edges(edge_name, left_name, left_id, transaction) {
        const Model = this.models[edge_name];
        const edges = await Model.findAll({
            where: {[left_name]: left_id},
        });
        return edges;
    }

    async set_edges(edge_name, left_name, left_id, right_name, right, transaction) {
        const Model = this.models[edge_name];
        const existing_edges = await Model.findAll({where: {[left_name]: left_id}});
        const existing_ids = existing_edges.map(edge => edge[right_name].toString());
        // Why specify fields? https://github.com/sequelize/sequelize/issues/11417
        const fields = [
            left_name,
            right_name,
            ...Object.keys(Object.values(right)[0] || {}),
        ];
        const [created_edges, updated_edges, deleted_edges] = await Promise.all([
            Promise.all(
                Object.keys(right)
                    .filter(right_id => !existing_ids.includes(right_id))
                    .map(right_id => Model.create({
                        [left_name]: left_id,
                        [right_name]: right_id,
                        ...right[right_id],
                    }, {fields, transaction}))
            ),
            Promise.all(
                existing_edges
                    .filter(edge => edge[right_name] in right)
                    .map(edge => edge.update(right[edge[right_name]], {transaction}))
            ),
            Promise.all(
                existing_edges
                    .filter(edge => !(edge[right_name] in right))
                    .map(edge => edge.destroy({transaction}))
            )
        ]);
        return [...created_edges, ...updated_edges];
    }

    async get_all(name, transaction) {
        const Model = this.models[name];
        return await Model.findAll({transaction});
    }
}

export default Database;
