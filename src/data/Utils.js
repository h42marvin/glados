import assert from 'assert';

let virtualID = 0;

export function getVirtualID() {
    virtualID -= 1;
    return virtualID;
}

export function isItem(item) {
    return item && typeof item.id === 'number';
}

export function isVirtualItem(item) {
    return item && item.id < 0;
}

export function isRealItem(item) {
    return item && item.id > 0;
}

export function getPartialItem(item) {
    return item ? { __type__: item.__type__, id: item.id, name: item.name } : null;
}

export function awaitSequence(items, method) {
    if (!items) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        let index = 0;
        const results = [];
        const next = () => {
            if (index === items.length) {
                resolve(results);
            } else {
                method(items[index], index, items)
                    .then((result) => {
                        results.push(result);
                        index += 1;
                        next();
                    })
                    .catch((error) => reject(error));
            }
        };
        next();
    });
}

export function filterAsync(items, method) {
    return new Promise((resolve, reject) => {
        Promise.all(items.map((item) => method(item)))
            .then((decisions) => {
                const results = [];
                decisions.forEach((decision, index) => {
                    if (decision) {
                        results.push(items[index]);
                    }
                });
                resolve(results);
            })
            .catch(reject);
    });
}

export function callbackToPromise(method, ...args) {
    return new Promise((resolve, reject) => {
        method(...args, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

export function getSortComparator(fieldNames) {
    const compare = (leftValue, rightValue) => {
        if (typeof leftValue === 'string') {
            assert(typeof rightValue === 'string');
            return leftValue.localeCompare(rightValue);
        } if (typeof leftValue === 'number') {
            assert(typeof rightValue === 'number');
            return leftValue - rightValue;
        }
        assert(false, `unsupported type: ${leftValue}`);
        return 0;
    };
    return (left, right) => {
        for (let ii = 0; ii < fieldNames.length; ii += 1) {
            const leftValue = left[fieldNames[ii]];
            const rightValue = right[fieldNames[ii]];
            if (typeof leftValue === 'undefined' || typeof rightValue === 'undefined') {
                return 0;
            }
            if (leftValue !== null && rightValue !== null) {
                return compare(leftValue, rightValue);
            } if (leftValue === null && rightValue !== null) {
                return 1;
            } if (leftValue !== null && rightValue === null) {
                return -1;
            }
        }
        return left.id - right.id;
    };
}
