
class DataLoader {
    constructor({ getInput, callback }) {
        this.getInput = getInput;
        this.input = null;
        this.cancelSubscription = null;
        this.callback = callback;
        this.reload();
    }

    reload({ force } = {}) {
        const input = this.getInput();
        if (!force && JSON.stringify(input) === JSON.stringify(this.input)) {
            return;
        }
        this.input = input;
        window.api.send(this.input.name, this.input.args)
            .then((data) => {
                this.setupSubscription();
                this.callback(data);
            });
    }

    // eslint-disable-next-line class-methods-use-this
    compare(name, left, right) {
        if (name.endsWith('-load')) {
            return left.id === right.id;
        } if (name.endsWith('-list')) {
            left = left.where || {};
            right = right.where || {};
            return Object.keys(left).every(
                (key) => typeof right[key] === 'undefined' || left[key] === right[key],
            );
        }
        return true;
    }

    setupSubscription() {
        const { promise, cancel } = window.api.subscribe(this.input.name);
        if (this.cancelSubscription) {
            this.cancelSubscription = cancel;
        }
        promise.then((data) => {
            const original = this.input.args || {};
            const modified = data || {};
            if (this.compare(this.input.name, original, modified)) {
                this.reload({ force: true });
            } else {
                this.setupSubscription();
            }
        });
    }

    stop() {
        if (this.cancelSubscription) {
            this.cancelSubscription();
        }
    }
}

export default DataLoader;
