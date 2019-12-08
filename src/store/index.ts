import readerStore from './reader-store';
import appStore from './app-store';

export type TStore = {
    readerStore: ReturnType<typeof readerStore>;
    appStore: ReturnType<typeof appStore>;
}

export function createStore(): TStore {
    // note the use of this which refers to observable instance of the store
    return {
        readerStore: readerStore(),
        appStore: appStore(),
    }
}
