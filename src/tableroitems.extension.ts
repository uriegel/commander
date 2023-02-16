export { }

declare global {

    interface Array<T> {
        mapToNumbers(): number[];
    }

    interface String {
        addiere1(): String
    }
}

Array.prototype.mapToNumbers = function () {
    return []
};

String.prototype.addiere1 = function () {
    return this + "1"
}